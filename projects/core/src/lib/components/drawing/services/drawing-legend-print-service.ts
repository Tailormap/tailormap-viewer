import { inject, Injectable } from '@angular/core';
import type { jsPDF } from 'jspdf';
import { concatMap, from, map, Observable, of, take, toArray } from 'rxjs';
import { selectDrawingFeatures } from '../state';
import { Store } from '@ngrx/store';
import { DrawingHelper, DrawingStyleIconComponent } from '../../../map';
import type { Svg2pdfOptions } from 'svg2pdf.js';
import { HttpClient } from '@angular/common/http';
import { TailormapApiConstants } from '@tailormap-viewer/api';
import { IconService } from '@tailormap-viewer/shared';

@Injectable({
  providedIn: 'root',
})
export class DrawingLegendPrintService {
  private store$ = inject(Store);
  private httpClient = inject(HttpClient);
  private iconService = inject(IconService);

  public addDrawingLegend(doc: jsPDF, _width: number, _height: number): Observable<void> {
    return this.store$.select(selectDrawingFeatures).pipe(
      take(1),
      map(features => {
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
      }),
      concatMap(features => {
        if (features.length === 0) {
          return of(undefined);
        }
        doc.addPage('a4', 'landscape');
        doc.setFontSize(20);
        doc.text('Legenda tekening', 297 / 2, 12, { align: 'center' });

        const fontSize = 15;
        const textX = 16;
        const startX = 12;
        const startY = 20;
        const iconSize = 10; // mm
        const iconSvgSize = 48; // px
        const iconMargin = 4.5;
        const width = 240;
        const rowWidth = width / 2 - 9;
        const maxItemsPerColumn = 23;
        const columnWidth = 100;

        doc.setDrawColor('black');
        doc.setFillColor('white');
        doc.setFontSize(fontSize);
        doc.rect(startX - 2, startY - 5, startX + width + 25, 180, 'FD');

        // Render features sequentially so svg2pdf doesn't clobber previous renders
        return from(features).pipe(
          concatMap((feature, idx) => {
            const columnX = Math.floor(idx / maxItemsPerColumn) * columnWidth;
            const columnY = idx % maxItemsPerColumn;

            const y = startY + (columnY * (iconSize - 2.5) + iconSize / 2) - (fontSize / 2);
            const text: string[] = doc.splitTextToSize(feature.attributes.style.description || '', rowWidth - iconSize - (iconMargin * 2));
            doc.text(text[0] + (text.length > 1  ? '...' : ''), textX + 2 + columnX, y, { baseline: 'top' });

            if (feature.attributes.type === 'IMAGE' && feature.attributes.style.markerImage?.endsWith('.svg')) {
              // For SVG images, we need to fetch the SVG content and embed it directly
              return this.httpClient.get(TailormapApiConstants.BASE_URL + feature.attributes.style.markerImage, { responseType: 'text' }).pipe(
                take(1),
                concatMap(svgContent => {
                  const svgImage = svgContent;
                  const options: Svg2pdfOptions = {
                    x: startX + columnX,
                    y: y,
                    width: iconSize - iconMargin,
                    height: iconSize - iconMargin,
                    loadExternalStyleSheets: false,
                  };
                  return from(this.addSvg2PDF(doc, svgImage, options));
                }),
              );
            }

            if (feature.attributes.type === 'POINT') {
              const markers = DrawingHelper.getAvailableMarkers();
              const marker = markers.find(m => m.value === feature.attributes.style.marker);
              const svgUrl = this.iconService.getUrlForIcon(marker?.value || '', 'markers');

              return this.httpClient.get(svgUrl, { responseType: 'text' }).pipe(
                take(1),
                concatMap(svgContent => {
                  const parser = new DOMParser();
                  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
                  const svgElement = svgDoc.querySelector('svg');

                  if (svgElement) {
                    const fillColor = feature.attributes.style.markerFillColor || '#000000';
                    const strokeColor = feature.attributes.style.markerStrokeColor || '#000000';
                    svgElement.setAttribute('fill', fillColor);
                    svgElement.setAttribute('stroke', strokeColor);
                    svgContent = new XMLSerializer().serializeToString(svgDoc);
                  }

                  const options: Svg2pdfOptions = {
                    x: startX + columnX,
                    y: y,
                    width: iconSize - iconMargin,
                    height: iconSize - iconMargin,
                    loadExternalStyleSheets: false,
                  };
                  return from(this.addSvg2PDF(doc, svgContent, options));
                }),
              );
            }

            const svgContent = DrawingStyleIconComponent.createSvgContent(feature.attributes.type, feature.attributes.style, 0.2);
            const svgImage = `<svg viewBox="0 0 ${iconSvgSize} ${iconSvgSize}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;

            const options: Svg2pdfOptions = {
              x: startX + columnX,
              y: y,
              width: iconSize,
              height: iconSize,
              loadExternalStyleSheets: false,
            };

            return from(this.addSvg2PDF(doc, svgImage, options));
          }),
          toArray(), // wait for all to complete
          map(() => undefined),
        );
      }),
    );
  }

  private addSvg2PDF(doc: jsPDF, svg: string, options: Svg2pdfOptions): Promise<jsPDF> {
    const element = document.createElement('div');
    element.innerHTML = svg;
    const svgEl = Array.from(element.children).find(c => c.nodeName.toLowerCase() === 'svg');
    if (svgEl) {
      return doc.svg(svgEl, options);
    } else {
      return Promise.reject(new Error('No SVG element found in SVG string'));
    }
  }
}
