import { Inject, Injectable } from '@angular/core';
import {
  TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel,
} from '@tailormap-viewer/api';
import { catchError, combineLatest, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectViewerId } from '../../../state/core.selectors';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileHelper, SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { HttpResponse } from '@angular/common/http';
import { DateTime } from 'luxon';

export enum SupportedExportFormats {
  CSV = 'csv',
  SHAPE = 'shape',
  GEOJSON = 'geojson',
  XLSX = 'xlsx',
  GEOPACKAGE = 'geopackage',
  DXF = 'dxf',
}

@Injectable({
  providedIn: 'root',
})
export class AttributeListExportService {

  private static CSV_FORMATS = [ 'csv', 'text/csv' ];
  private static XLSX_FORMATS = [ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'excel2007' ];
  private static SHAPE_FORMATS = [ 'application/vnd.shp', 'application/x-zipped-shp', 'SHAPE-ZIP' ];
  private static GEOPACKAGE_FORMATS = [ 'application/geopackage+sqlite3', 'application/x-gpkg', 'geopackage', 'geopkg', 'gpkg' ];
  private static GEOJSON_FORMATS = [ 'application/geo+json', 'application/geojson', 'application/json', 'json' ];
  private static DXF_FORMATS = ['DXF-ZIP'];

  private cachedFormats: Map<string, string[]> = new Map();

  constructor(
    private store$: Store,
    private snackBar: MatSnackBar,
    @Inject(TAILORMAP_API_V1_SERVICE) private api: TailormapApiV1ServiceModel,
    @Inject(MAT_DATE_LOCALE) private dateLocale: string,
  ) {
  }

  public getExportFormats$(layerName: string): Observable<SupportedExportFormats[]> {
    return this.getExportCapabilities$(layerName).pipe(
      map(formats => {
        const supportedFormats: SupportedExportFormats[] = [];
        if (this.hasSupport(formats, AttributeListExportService.CSV_FORMATS)) {
          supportedFormats.push(SupportedExportFormats.CSV);
        }
        if (this.hasSupport(formats, AttributeListExportService.XLSX_FORMATS)) {
          supportedFormats.push(SupportedExportFormats.XLSX);
        }
        if (this.hasSupport(formats, AttributeListExportService.SHAPE_FORMATS)) {
          supportedFormats.push(SupportedExportFormats.SHAPE);
        }
        if (this.hasSupport(formats, AttributeListExportService.GEOPACKAGE_FORMATS)) {
          supportedFormats.push(SupportedExportFormats.GEOPACKAGE);
        }
        if (this.hasSupport(formats, AttributeListExportService.GEOJSON_FORMATS)) {
          supportedFormats.push(SupportedExportFormats.GEOJSON);
        }
        if (this.hasSupport(formats, AttributeListExportService.DXF_FORMATS)) {
          supportedFormats.push(SupportedExportFormats.DXF);
        }
        return supportedFormats;
      }),
    );
  }

  public export$(params: {
    layerName: string;
    serviceLayerName: string;
    format: SupportedExportFormats;
    filter: string | undefined;
    sort: { column: string; direction: string } | null;
    attributes: string[];
  }): Observable<boolean> {
    return combineLatest([
      this.getOutputFormat$(params.layerName, params.format),
      this.store$.select(selectViewerId),
    ]).pipe(
      take(1),
      switchMap(([ outputFormat, applicationId ]) => {
        const defaultErrorMessage = $localize `Exporting data for layer ${params.serviceLayerName} and format ${params.format} failed`;
        if (applicationId === null || outputFormat === null) {
          this.showSnackbarMessage(defaultErrorMessage);
          return of(null);
        }
        return this.api.getLayerExport$({
          applicationId,
          layerName: params.layerName,
          outputFormat,
          filter: params.filter,
          sort: params.sort,
          attributes: params.attributes,
        })
          .pipe(
            catchError(() => {
              this.showSnackbarMessage(defaultErrorMessage);
              return of(null);
            }),
          );
      }),
      tap((response: HttpResponse<Blob> | null) => {
        if (!response || !response.body) {
          return;
        }
        const date = DateTime.now().setLocale(this.dateLocale).toLocaleString(DateTime.DATETIME_SHORT).replace(/,? /g, '_');
        const defaultFilename = [ $localize `Export`, params.serviceLayerName, date ].join('_') + '.' + this.getExtensionForFormat(params.format);
        const fileName = FileHelper.extractFileNameFromContentDispositionHeader(response.headers.get('Content-Disposition') || '', defaultFilename);
        FileHelper.saveAsFile(response.body, fileName);
      }),
      map((response: HttpResponse<Blob> | null) => {
        return !!(response && response.body);
      }),
    );
  }

  private showSnackbarMessage(msg: string) {
    const config: SnackBarMessageOptionsModel = {
      message: msg,
      duration: 5000,
      showDuration: true,
      showCloseButton: true,
    };
    SnackBarMessageComponent.open$(this.snackBar, config).subscribe();
  }

  private getOutputFormat$(layerName: string, format: SupportedExportFormats): Observable<string | null> {
    return this.getExportCapabilities$(layerName)
      .pipe(
        take(1),
        map(formats => {
          switch (format) {
            case SupportedExportFormats.CSV:
              return this.getOutputFormat(formats, AttributeListExportService.CSV_FORMATS);
            case SupportedExportFormats.XLSX:
              return this.getOutputFormat(formats, AttributeListExportService.XLSX_FORMATS);
            case SupportedExportFormats.SHAPE:
              return this.getOutputFormat(formats, AttributeListExportService.SHAPE_FORMATS);
            case SupportedExportFormats.GEOPACKAGE:
              return this.getOutputFormat(formats, AttributeListExportService.GEOPACKAGE_FORMATS);
            case SupportedExportFormats.GEOJSON:
              return this.getOutputFormat(formats, AttributeListExportService.GEOJSON_FORMATS);
            case SupportedExportFormats.DXF:
              return this.getOutputFormat(formats, AttributeListExportService.DXF_FORMATS);
          }
          return null;
        }),
      );
  }

  private getOutputFormat(supportedFormats: string[], requiredFormats: string[]): string | null {
    return supportedFormats.find(format => requiredFormats.includes(format)) || null;
  }

  private getExtensionForFormat(format: SupportedExportFormats): string {
    switch (format) {
      case SupportedExportFormats.CSV:
        return 'csv';
      case SupportedExportFormats.XLSX:
        return 'xlsx';
      case SupportedExportFormats.SHAPE:
        return 'zip';
      case SupportedExportFormats.GEOPACKAGE:
        return 'gpkg';
      case SupportedExportFormats.GEOJSON:
        return 'geojson';
      case SupportedExportFormats.DXF:
        return 'zip';
    }
    return 'txt';
  }

  private getExportCapabilities$(layerName: string): Observable<string[]> {
    return this.store$.select(selectViewerId).pipe(
      take(1),
      switchMap(applicationId => {
        if (applicationId === null) {
          return of([]);
        }
        const key = this.getCacheKey(applicationId, layerName);
        const cached = this.cachedFormats.get(key);
        if (cached) {
          return of(cached);
        }
        return this.api.getLayerExportCapabilities$({ applicationId, layerName: layerName })
          .pipe(
            catchError(() => of({ exportable: false, outputFormats: [] })),
            tap(capabilities => {
              if (capabilities.exportable) {
                this.cachedFormats.set(key, capabilities.outputFormats);
              }
            }),
            map(capabilities => capabilities.exportable ? (capabilities.outputFormats || []) : []),
          );
      }),
    );
  }

  private hasSupport(supportedFormats: string[], requiredFormats: string[]) {
    return supportedFormats.some(format => requiredFormats.includes(format));
  }

  private getCacheKey(applicationId: string, layerName: string): string {
    return `${applicationId}-${layerName}`;
  }

}
