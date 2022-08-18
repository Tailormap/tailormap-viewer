import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { concatMap, map, Observable, tap } from 'rxjs';
import { jsPDF } from 'jspdf';
import { LayerModel, MapService, OlLayerFilter } from '@tailormap-viewer/map';
import 'svg2pdf.js';
import { HttpClient } from '@angular/common/http';
import { IconService } from '@tailormap-viewer/shared';
import { Svg2pdfOptions } from 'svg2pdf.js';

interface Size {
  width: number;
  height: number;
}

// Sizes in millimeters. Default is landscape
const a4Size: Size = { width: 297, height: 210 };
const a3Size: Size = { width: 420, height: 297 };

interface PrintOptions {
  title?: string;
  footer?: string;
  showLegend?: boolean;
  showWindrose?: boolean;
  showScale?: boolean;
  orientation?: 'portrait' | 'landscape';
  size: 'a3' | 'a4';
  resolution?: number;
  filename?: string;
  autoPrint?: boolean;
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
    @Inject(LOCALE_ID) public locale: string,
    private httpClient: HttpClient,
    private iconService: IconService,
  ) { }

  public create$(printOptions: PrintOptions, layers: LayerModel[], vectorLayerFilter?: OlLayerFilter): Observable<string> {
    let size = printOptions.size === 'a3' ? a3Size : a4Size;
    if (printOptions.orientation === 'portrait') {
      // noinspection JSSuspiciousNameCombination
      size = { width: size.height, height: size.width };
    }
    const mapSize = {
      width: size.width - (2 * this.defaultMargin),
      height: size.height - (2 * this.defaultMargin),
    };
    if (printOptions.title) {
      mapSize.height -= 2;
    }
    const doc = new jsPDF({
      format: printOptions.size,
      orientation: printOptions.orientation || 'landscape',
    });
    doc.setFontSize(this.defaultFontSize);
    doc.setFont('helvetica');

    const x = this.defaultMargin;
    let y = this.defaultMargin;
    if (printOptions.title) {
      doc.setFontSize(this.titleSize);
      doc.text(printOptions.title, x, y);
      doc.setFontSize(this.defaultFontSize);
      y += 2;
    }
    if (printOptions.footer) {
      doc.setFontSize(8);
      doc.text(printOptions.footer, x, size.height - 5);
      doc.setFontSize(this.defaultFontSize);
    }
    this.addDateTime(doc, size.width, size.height);

    if (printOptions.autoPrint) {
      doc.autoPrint();
    }
    return this.addMapImage$(doc, x, y, mapSize, printOptions.resolution || 72, layers, vectorLayerFilter).pipe(
      concatMap(() => this.addSvg2PDF$(doc, this.iconService.getUrlForIcon('logo'), { x: size.width - 30, y, width: 20, height: 20 })),
      concatMap(() => this.addSvg2PDF$(doc, this.iconService.getUrlForIcon('north_arrow'), { x, y: y + 2, width: 20, height: 20 })),
      map(() => doc.output('dataurlstring', { filename: printOptions.filename || $localize `map.pdf` })),
    );
  }

  private addSvg2PDF$(doc: jsPDF, url: string, options: Svg2pdfOptions): Observable<jsPDF> {
    return this.httpClient.get(url, { responseType: 'text' }).pipe(
      concatMap(svg => {
        const element = document.createElement('div');
        element.innerHTML = svg;
        return doc.svg(element.firstChild as HTMLElement, options);
      }),
    );
  }

  private addMapImage$(doc: jsPDF, x: number, y: number, mapSize: Size, resolution: number, layers: LayerModel[], vectorLayerFilter?: OlLayerFilter): Observable<string> {
    return this.mapService.exportMapImage$({ widthInMm: mapSize.width, heightInMm: mapSize.height, resolution, layers, vectorLayerFilter }).pipe(
      tap(dataURL => {
        // Note: calling addImage() with a HTMLCanvasElement is actually slower than adding by PNG
        doc.addImage(dataURL, 'PNG', x, y, mapSize.width, mapSize.height, '', 'FAST');
      }),
    );
  }

  private addDateTime(doc: jsPDF, width: number, height: number) {
    const text = $localize `Created on `;
    const date = text + new Intl.DateTimeFormat(this.locale, { dateStyle: 'full', timeStyle: 'medium' }).format(new Date());
    const dateFontSize = 8;
    doc.setFontSize(dateFontSize);
    // See http://raw.githack.com/MrRio/jsPDF/master/docs/module-split_text_to_size.html#~getStringUnitWidth
    const dateWidthInMM = (doc.getStringUnitWidth(date) * dateFontSize) / (72 / 25.6);
    doc.text(date, width - dateWidthInMM - 8, height - 5);
    doc.setFontSize(this.defaultFontSize);
  }
}
