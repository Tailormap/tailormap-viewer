import { inject, Injectable } from '@angular/core';
import type { jsPDF } from 'jspdf';
import { catchError, concatMap, from, map, Observable, of, take, toArray } from 'rxjs';
import { selectDrawingFeatures } from '../state';
import { Store } from '@ngrx/store';
import { DrawingFeatureModel, DrawingHelper, DrawingStyleIconComponent } from '../../../map';
import type { Svg2pdfOptions } from 'svg2pdf.js';
import { HttpClient } from '@angular/common/http';
import { TailormapApiConstants } from '@tailormap-viewer/api';
import { IconService } from '@tailormap-viewer/shared';

const layout = {
  fontSizeTitle: 20,
  fontSize: 15,
  textX: 16,
  startX: 12,
  startY: 20,
  iconSize: 10, // mm
  iconSvgSize: 48, // px
  iconMargin: 4.5,
  width: 240,
  rowWidth: 240 / 2 - 9,
  maxItemsPerColumn: 23,
  columnWidth: 100,
};
const a4Width = 297;

@Injectable({
  providedIn: 'root',
})
export class DrawingLegendPrintService {
  private store$ = inject(Store);
  private httpClient = inject(HttpClient);
  private iconService = inject(IconService);
  private domParser = new DOMParser();

  public addDrawingLegend(doc: jsPDF, _width: number, _height: number): Observable<void> {
    return this.store$.select(selectDrawingFeatures).pipe(
      take(1),
      map(DrawingLegendPrintService.filterAndReorderFeaturesForLegend),
      concatMap(features => {
        if (features.length === 0) {
          return of(undefined);
        }
        doc.addPage('a4', 'landscape');
        doc.setFontSize(layout.fontSizeTitle);
        doc.text('Legenda tekening', a4Width / 2, 12, { align: 'center' });

        const { fontSize, textX, startX, startY, iconSize, width, maxItemsPerColumn, columnWidth, rowWidth, iconMargin } = layout;

        doc.setDrawColor('black');
        doc.setFillColor('white');
        doc.setFontSize(fontSize);
        doc.rect(startX - 2, startY - 5, startX + width + 25, 180, 'FD');

        // Render features sequentially so svg2pdf doesn't clobber previous renders
        return from(features).pipe(
          concatMap((feature, idx) => {
            const columnX = Math.floor(idx / maxItemsPerColumn) * columnWidth;
            const columnY = idx % maxItemsPerColumn;
            const x = startX + columnX;
            const y = startY + (columnY * (iconSize - 2.5) + iconSize / 2) - (fontSize / 2);

            const text: string[] = doc.splitTextToSize(feature.attributes.style.description || '', rowWidth - iconSize - (iconMargin * 2));
            doc.text(text[0] + (text.length > 1  ? '...' : ''), textX + 2 + columnX, y, { baseline: 'top' });

            if (feature.attributes.type === 'IMAGE') {
              return this.addImage(doc, feature, x, y);
            } else if (feature.attributes.type === 'POINT') {
              return this.addMarkerSvg(doc, feature, x, y);
            } else {
              return this.addStyleSvg(doc, feature, x, y);
            }
          }),
          toArray(), // wait for all to complete
          map(() => undefined),
        );
      }),
    );
  }

  private static filterAndReorderFeaturesForLegend(features: DrawingFeatureModel[]): DrawingFeatureModel[] {
    const filteredFeatures = features.filter(f => f.attributes.style.description);

    // For IMAGE type features, keep only distinct ones based on markerImage and description
    const imageFeatures = filteredFeatures.filter(f => f.attributes.type === 'IMAGE');
    const nonImageFeatures = filteredFeatures.filter(f => f.attributes.type !== 'IMAGE');

    const distinctImageFeatures = imageFeatures.reduce((acc, feature) => {
      const key = `${feature.attributes.style.markerImage || ''}_${feature.attributes.style.description || ''}`;
      if (!acc.has(key)) {
        acc.set(key, feature);
      }
      return acc;
    }, new Map());

    return [ ...nonImageFeatures, ...Array.from(distinctImageFeatures.values()) ];
  }

  private addImage(doc: jsPDF, feature: DrawingFeatureModel, x: number, y: number): Observable<jsPDF> {
    if(!feature.attributes.style.markerImage?.endsWith('.svg')) {
      console.error(`Image extension not supported for drawing legend: ${feature.attributes.style.markerImage}`);
      return of(doc);
    }

    return this.httpClient.get(TailormapApiConstants.BASE_URL + feature.attributes.style.markerImage, { responseType: 'text' }).pipe(
      take(1),
      concatMap(svgContent => {
        return this.addSvgIcon(doc, svgContent, x, y, layout.iconMargin);
      }),
      catchError(error => {
        console.error('Error loading image for drawing legend:', error);
        return of(doc);
      }),
    );
  }

  private addMarkerSvg(doc: jsPDF, feature: DrawingFeatureModel, x: number, y: number): Observable<jsPDF> {
    const markers = DrawingHelper.getAvailableMarkers();
    const marker = markers.find(m => m.value === feature.attributes.style.marker);
    const svgUrl = this.iconService.getUrlForIcon(marker?.value || '', 'markers');

    return this.httpClient.get(svgUrl, { responseType: 'text' }).pipe(
      take(1),
      concatMap(svgContent => {
        const svgDoc = this.domParser.parseFromString(svgContent, 'image/svg+xml');
        const svgEl = svgDoc.querySelector('svg');
        if (svgEl) {
          const fillColor = feature.attributes.style.markerFillColor || '#000000';
          const strokeColor = feature.attributes.style.markerStrokeColor || '#000000';
          svgEl.setAttribute('fill', fillColor);
          svgEl.setAttribute('stroke', strokeColor);
          return this.addSvgIcon(doc, svgEl, x, y, layout.iconMargin);
        } else {
          return this.addSvgIcon(doc, svgContent, x, y, layout.iconMargin);
        }
      }),
      catchError(error => {
        console.error('Error loading marker svg for drawing legend:', error);
        return of(doc);
      }),
    );
  }

  private addStyleSvg(doc: jsPDF, feature: DrawingFeatureModel, x: number, y: number) {
    const svgContent = DrawingStyleIconComponent.createSvgContent(feature.attributes.type, feature.attributes.style, 0.2);
    const svgImage = `<svg viewBox="0 0 ${layout.iconSvgSize} ${layout.iconSvgSize}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
    return this.addSvgIcon(doc, svgImage, x, y);
  }

  private addSvgIcon(doc: jsPDF, svg: string | SVGSVGElement, x: number, y: number, margin = 0): Observable<jsPDF> {
    const element = document.createElement('div');
    if (svg instanceof SVGSVGElement) {
      element.appendChild(svg.cloneNode(true));
    } else {
      element.innerHTML = svg;
    }
    const svgEl = element.querySelector('svg');
    if (svgEl) {
      const viewBox = svgEl.getAttribute('viewBox');
      const svgWidth = svgEl.getAttribute('width');
      const svgHeight = svgEl.getAttribute('height');

      if (viewBox == null && svgWidth != null && svgHeight != null) {
        svgEl.setAttribute('viewBox', `0 0 ${parseFloat(svgWidth)} ${parseFloat(svgHeight)}`);
      }

      const options: Svg2pdfOptions = {
        x,
        y,
        width: layout.iconSize - margin,
        height: layout.iconSize - margin,
      };
      return from(doc.svg(svgEl, options));
    } else {
      console.error('No SVG element found', svg);
      return of(doc);
    }
  }
}
