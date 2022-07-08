import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { jsPDF } from 'jspdf';
import { $localize } from '@angular/localize/init';
import { MapService } from '@tailormap-viewer/map';

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
  resolution?: 72 | 150 | 300;
}

@Injectable({
  providedIn: 'root',
})
export class MapPdfService {

  private readonly defaultMargin = 5;
  private readonly defaultLegendWidth = 0.3;
  private readonly titleSize = 12;
  private readonly defaultFontSize = 8;

  constructor(
    private mapService: MapService,
  ) { }

  public create$(
    printOptions: PrintOptions,
  ): Observable<any> {
    let size = printOptions.size === 'a3' ? a3Size : a4Size;
    if (printOptions.orientation === 'portrait') {
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

    return this.addMapImage$(doc, x, y, mapSize, printOptions.resolution || 72).pipe(
      tap(() => {
        const filenameDate = new Intl.DateTimeFormat('nl-NL',{ dateStyle: 'short', timeStyle: 'medium'}).format(new Date()).replace(' ', '_');
        doc.save(`map-${filenameDate}.pdf`);
      }),
    );
    return of(true);
  }

  private addMapImage$(doc: jsPDF, x: number, y: number, mapSize: Size, resolution: number): Observable<any> {
    return this.mapService.createImageExport(mapSize.width, mapSize.height, resolution).pipe(
      tap(dataURL => {
        doc.addImage(dataURL, 'PNG', x, y, mapSize.width, mapSize.height);
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
