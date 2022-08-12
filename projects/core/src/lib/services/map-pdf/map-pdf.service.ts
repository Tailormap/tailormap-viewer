import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { jsPDF } from 'jspdf';
import { LayerModel, MapService } from '@tailormap-viewer/map';

interface Size {
  width: number;
  height: number;
}

// Sizes in millimeters. Default is landscape
const a4Size: Size = { width: 297, height: 210 };
const a3Size: Size = { width: 420, height: 297 };

interface PrintOptions {
  title?: string;
  showLegend?: boolean;
  showWindrose?: boolean;
  showScale?: boolean;
  orientation?: 'portrait' | 'landscape';
  size: 'a3' | 'a4';
  resolution?: number;
  filename?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MapPdfService {

  private readonly defaultMargin = 5;
  private readonly titleSize = 12;
  private readonly defaultFontSize = 8;

  constructor(
    private mapService: MapService,
  ) { }

  public create$(printOptions: PrintOptions, layers: LayerModel[]): Observable<string> {
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
    this.addDateTime(doc, size.width, size.height);

    return this.addMapImage$(doc, x, y, mapSize, printOptions.resolution || 72, layers).pipe(
      map(() => doc.output('dataurlstring', { filename: printOptions.filename || 'map.pdf'})),
    );
  }

  private addMapImage$(doc: jsPDF, x: number, y: number, mapSize: Size, resolution: number, layers: LayerModel[]): Observable<string> {
    return this.mapService.exportMapImage$({ widthInMm: mapSize.width, heightInMm: mapSize.height, resolution, layers}).pipe(
      tap(dataURL => {
        doc.addImage(dataURL, 'PNG', x, y, mapSize.width, mapSize.height, '', 'FAST');
      }),
    );
  }

  private addDateTime(doc: jsPDF, width: number, height: number) {
    const text = $localize `Gemaakt op `;
    const date = text + new Intl.DateTimeFormat('nl-NL', { dateStyle: 'full', timeStyle: 'medium'}).format(new Date());
    const dateFontSize = 6;
    doc.setFontSize(dateFontSize);
    // See http://raw.githack.com/MrRio/jsPDF/master/docs/module-split_text_to_size.html#~getStringUnitWidth
    const dateWidthInMM = (doc.getStringUnitWidth(date) * dateFontSize) / (72 / 25.6);
    doc.text(date, width - dateWidthInMM - 2, height - 2);
    doc.setFontSize(this.defaultFontSize);
  }
}
