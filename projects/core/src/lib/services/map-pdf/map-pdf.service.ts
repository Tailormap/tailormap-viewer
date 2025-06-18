import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { concatMap, forkJoin, from, map, Observable, of, tap, take } from 'rxjs';
import { LayerModel, MapService, OlLayerFilter, OpenlayersExtent } from '@tailormap-viewer/map';
import { HttpClient } from '@angular/common/http';
import { IconService } from '@tailormap-viewer/shared';
import type { jsPDF } from 'jspdf';
import type { Svg2pdfOptions } from 'svg2pdf.js';
import { LegendService } from '../../components/legend/services/legend.service';
import { ExtendedAppLayerModel } from '../../map/models';
import { ServerType } from '@tailormap-viewer/api';
import { ImageHelper } from '../../shared/helpers/image.helper';

interface Size {
  width: number;
  height: number;
}

// Sizes in millimeters. Default is landscape
const a4Size: Size = { width: 297, height: 210 };
const a3Size: Size = { width: 420, height: 297 };

export interface MapPdfPrintOptions {
  title?: string;
  footer?: string;
  showLegend?: boolean;
  showWindrose?: boolean;
  showScale?: boolean;
  orientation?: 'portrait' | 'landscape';
  size: 'a3' | 'a4';
  mapExtent?: OpenlayersExtent | null; // Must be in ISO standard paper width/height ratio of Math.sqrt(2) (depending on orientation)!
  dpi?: number;
  filename?: string;
  autoPrint?: boolean;
  logo?: string | null;
  bookmarkUrl?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class MapPdfService {

  private readonly defaultMargin = 8;
  private readonly titleSize = 12;
  private readonly defaultFontSize = 8;

  constructor(
    private mapService: MapService,
    @Inject(LOCALE_ID) private locale: string,
    private httpClient: HttpClient,
    private iconService: IconService,
    private legendService: LegendService,
  ) { }

  public create$(options: {
    printOptions: MapPdfPrintOptions;
    layers: LayerModel[];
    backgroundLayers: LayerModel[];
    legendLayers$: Observable<ExtendedAppLayerModel[]>;
    vectorLayerFilter?: OlLayerFilter;
  }): Observable<string> {
    let size = options.printOptions.size === 'a3' ? a3Size : a4Size;
    if (options.printOptions.orientation === 'portrait') {
      // noinspection JSSuspiciousNameCombination
      size = { width: size.height, height: size.width };
    }
    // Map extent assumed to be in width/height ratio of ISO standard paper sizes depending on orientation: Math.sqrt(2)
    // When different layouts are added in the future with a different map image width/height ratio, the map preview width/height ratio must
    // be kept the same as the image ratio used in the layout.
    const mapSize = {
      width: size.width - (2 * this.defaultMargin),
      height: size.height - (2 * this.defaultMargin),
    };
    if (options.printOptions.title) {
      mapSize.height -= 2;
    }

    return from(import('jspdf'))
      .pipe(
        map(m => m.jsPDF),
        concatMap(jsPdfImport => forkJoin([ of(jsPdfImport), from(import('svg2pdf.js')) ])),
        concatMap(([jsPdfImport]) => {
          return this.createPdfDoc$(
            jsPdfImport,
            {
              printOptions: options.printOptions,
              size,
              mapSize,
              layers: options.layers,
              backgroundLayers: options.backgroundLayers,
              legendLayers$: options.legendLayers$,
              vectorLayerFilter: options.vectorLayerFilter,
            },
          );
        }),
      );
  }

  private createPdfDoc$(pdfCreator: typeof jsPDF, options: {
    printOptions: MapPdfPrintOptions;
    size: Size;
    mapSize: Size;
    layers: LayerModel[];
    backgroundLayers: LayerModel[];
    legendLayers$: Observable<ExtendedAppLayerModel[]>;
    vectorLayerFilter?: OlLayerFilter;
  }) {
    const doc = new pdfCreator({
      format: options.printOptions.size,
      orientation: options.printOptions.orientation || 'landscape',
    });
    doc.setFontSize(this.defaultFontSize);
    doc.setFont('helvetica');

    const x = this.defaultMargin;
    let y = this.defaultMargin;
    if (options.printOptions.title) {
      doc.setFontSize(this.titleSize);
      doc.text(options.printOptions.title, x, y);
      doc.setFontSize(this.defaultFontSize);
      y += 2;
    }
    if (options.printOptions.footer) {
      doc.setFontSize(8);
      doc.text(options.printOptions.footer, x, options.size.height - 5);
      doc.setFontSize(this.defaultFontSize);
    }
    this.addDateTime(doc, options.size.width, options.size.height);
    if (options.printOptions.autoPrint) {
      doc.autoPrint();
    }
    return this.addMapImage$({
      doc,
      x,
      y,
      mapSize: options.mapSize,
      extent: options.printOptions.mapExtent || null,
      dpi: options.printOptions.dpi || 72,
      layers: options.layers,
      backgroundLayers: options.backgroundLayers,
      vectorLayerFilter: options.vectorLayerFilter,
    }).pipe(
      concatMap(() => this.addLegendImages$(doc, options.size.width, options.size.height, options.legendLayers$)),
      concatMap(() => {
        if (options.printOptions.logo) {
          return this.addImage2PDF$(doc, options.printOptions.logo, options.size.width - 30, y);
        }
        return this.addSvg2PDF$(doc, this.iconService.getUrlForIcon('logo'), { x: options.size.width - 30, y, width: 20, height: 20 });
      }),
      concatMap(() => this.addSvg2PDF$(doc, this.iconService.getUrlForIcon('north_arrow'), { x, y: y + 2, width: 20, height: 20 })),
      concatMap(() => this.addBookmark2PDF$(doc, options.printOptions.bookmarkUrl, x, y, options.size)),
      map(() => doc.output('dataurlstring', { filename: options.printOptions.filename || $localize `:@@core.print.default-pdf-filename:map.pdf` })),
    );
  }

  private addLegendImages$(doc: jsPDF, width: number, height: number, layers$: Observable<Array<ExtendedAppLayerModel>>) {
    const legendDpiByLayer = new Map<ExtendedAppLayerModel, number>();

    const legendURLCallback = (layer: ExtendedAppLayerModel, url: URL) => {
      legendDpiByLayer.set(layer, 90);

      if (layer.service?.serverType === ServerType.GEOSERVER && layer.legendType === 'dynamic') {
        // Use LEGEND_OPTIONS vendor specific Geoserver parameter, see https://docs.geoserver.org/stable/en/user/services/wms/get_legend_graphic/index.html
        const dpi = 180;
        legendDpiByLayer.set(layer, dpi);
        url.searchParams.set('LEGEND_OPTIONS', `dpi:${dpi};fontAntiAliasing:true;labelMargin:0;columnheight:300`);
      }
    };

    return this.legendService.getLegendImages$(layers$, legendURLCallback).pipe(
      tap(legendImages => {
        legendImages.forEach(legendImage => {
          if (legendImage.imageData != null) {
            // XXX put legend images on top of each other for now, more complex layout to be implemented later
            const dpi = legendDpiByLayer.get(legendImage.appLayer) || 90;
            const extraShrinkFactor = 1.25;
            const widthMm = legendImage.width / (dpi / 25.4) / extraShrinkFactor; // 1 inch is 25.4 mm
            const heightMm = legendImage.height / (dpi / 25.4) / extraShrinkFactor;
            const x = width - widthMm - 10;
            const y = height - heightMm - 10;
            doc.addImage(legendImage.imageData, 'PNG', x, y, widthMm, heightMm, '', 'FAST');
            doc.setDrawColor(0);
            doc.rect(x, y, widthMm, heightMm, 'S');
          }
        });
      }),
    );
  }

  private addSvg2PDF$(doc: jsPDF, url: string, options: Svg2pdfOptions): Observable<jsPDF> {
    return this.httpClient.get(url, { responseType: 'text' }).pipe(
      concatMap(svg => {
        const element = document.createElement('div');
        element.innerHTML = svg;
        const svgEl = Array.from(element.children).find(c => c.nodeName.toLowerCase() === 'svg');
        if (!svgEl) {
          return of(doc);
        }
        return doc.svg(svgEl, options);
      }),
    );
  }

  private addImage2PDF$(doc: jsPDF, url: string, x: number, y: number): Observable<jsPDF> {
    return ImageHelper.imageUrlToPng$(url)
      .pipe(take(1), map(img => {
        return doc.addImage(img.imageData, 'PNG', x, y, 20, 20, '', 'FAST');
      }));
  }

  private addBookmark2PDF$(doc: jsPDF, bookmarkUrl: string | null | undefined, x: number, y: number, size: Size): Observable<jsPDF> {
    if (!bookmarkUrl) {
      return of(doc);
    }

    const foreground = '#0000FF';
    const background = '#FFFFFF';
    const restoreTextCol = doc.getTextColor();
    const restoreFillCol = doc.getFillColor();
    const restoreDrawCol = doc.getDrawColor();

    return ImageHelper.string2Base64QRcode$(bookmarkUrl, foreground, background).pipe(take(1), map(imgData => {
      const bookmarkText = $localize`:@@core.print.bookmark-text:Bookmark`;
      const bookmarkTextFontSize = 8;
      const bookmarkTextWidthInMM = (doc.getStringUnitWidth(bookmarkText) * bookmarkTextFontSize) / (72 / 25.6);
      const boxMargin = .3;
      const bookmarkTextBoxHeightInMM = 3;
      const imgHeightMM = Math.max(imgData.heightPx * 25.4 / 72, bookmarkTextWidthInMM + boxMargin);
      const imgWidthMM = Math.max(imgData.widthPx * 25.4 / 72, bookmarkTextWidthInMM + boxMargin);

      // setup for left bottom corner above the scalebar
      const top = size.height - imgHeightMM - this.defaultMargin - 15;
      const left = this.defaultMargin + 2 * boxMargin;

      doc.setFontSize(bookmarkTextFontSize).setTextColor(foreground).setFillColor(background).setDrawColor(foreground);

      const boxWidth = imgWidthMM + 2 * boxMargin;
      doc.rect(left - boxMargin, top - bookmarkTextBoxHeightInMM - boxMargin, boxWidth, imgHeightMM + bookmarkTextBoxHeightInMM + 2 * boxMargin, 'FD');
      doc.link(left - boxMargin, top - bookmarkTextBoxHeightInMM - boxMargin, boxWidth, imgHeightMM + bookmarkTextBoxHeightInMM + 2 * boxMargin, { url: bookmarkUrl });

      const textAlignOffset = Math.max((boxWidth - bookmarkTextWidthInMM) / 2, boxMargin) + left;
      doc.textWithLink(bookmarkText, textAlignOffset, top - boxMargin, { url: bookmarkUrl });
      doc.addImage(imgData.imageData, 'gif', left, top, imgWidthMM, imgHeightMM);
      // reset and return
      return doc.setFontSize(this.defaultFontSize).setTextColor(restoreTextCol).setFillColor(restoreFillCol).setDrawColor(restoreDrawCol);
    }));
  }

  private addMapImage$(options: {
    doc: jsPDF;
    x: number;
    y: number;
    mapSize: Size;
    extent: OpenlayersExtent | null;
    dpi: number;
    layers: LayerModel[];
    backgroundLayers: LayerModel[];
    vectorLayerFilter?: OlLayerFilter;
  }): Observable<string> {
    return this.mapService.exportMapImage$({
      widthInMm: options.mapSize.width,
      heightInMm: options.mapSize.height,
      extent: options.extent,
      dpi: options.dpi,
      layers: options.layers,
      backgroundLayers: options.backgroundLayers,
      vectorLayerFilter: options.vectorLayerFilter,
    }).pipe(
      tap(dataURL => {
        // Note: calling addImage() with a HTMLCanvasElement is actually slower than adding by PNG
        options.doc.addImage(dataURL, 'PNG', options.x, options.y, options.mapSize.width, options.mapSize.height, '', 'FAST');
      }),
    );
  }

  private addDateTime(doc: jsPDF, width: number, height: number) {
    const text = $localize `:@@core.print.created-on:Created on`;
    const date = text + ' ' + new Intl.DateTimeFormat(this.locale, { dateStyle: 'full', timeStyle: 'medium' }).format(new Date());
    const dateFontSize = 8;
    doc.setFontSize(dateFontSize);
    // See http://raw.githack.com/MrRio/jsPDF/master/docs/module-split_text_to_size.html#~getStringUnitWidth
    const dateWidthInMM = (doc.getStringUnitWidth(date) * dateFontSize) / (72 / 25.6);
    doc.text(date, width - dateWidthInMM - 8, height - 5);
    doc.setFontSize(this.defaultFontSize);
  }

}
