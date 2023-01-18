import { Inject, Injectable } from '@angular/core';
import {
  TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel,
} from '@tailormap-viewer/api';
import { catchError, combineLatest, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectApplicationId } from '../../../state/core.selectors';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';

export enum SupportedExportFormats {
  CSV = 'csv',
  SHAPE = 'shape',
  GEOJSON = 'geojson',
  XLSX = 'xlsx',
  GEOPACKAGE = 'geopackage',
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

  private cachedFormats: Map<string, string[]> = new Map();

  constructor(
    private store$: Store,
    private snackBar: MatSnackBar,
    @Inject(TAILORMAP_API_V1_SERVICE) private api: TailormapApiV1ServiceModel,
    @Inject(MAT_DATE_LOCALE) private dateLocale: string,
  ) {
  }

  public getExportFormats$(layerId: number): Observable<SupportedExportFormats[]> {
    return this.getExportCapabilities$(layerId).pipe(
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
        return supportedFormats;
      }),
    );
  }

  public export$(layerId: number, layerName: string, format: SupportedExportFormats, filter?: string): Observable<boolean> {
    return combineLatest([
      this.getOutputFormat$(layerId, format),
      this.store$.select(selectApplicationId),
    ]).pipe(
      take(1),
      switchMap(([ outputFormat, applicationId ]) => {
        if (applicationId === null || outputFormat === null) {
          this.showSnackbarMessage($localize `Exporting data for format ${format} failed`);
          return of(false);
        }
        this.showSnackbarMessage();
        const a = document.createElement('a');
        a.href = this.api.getLayerExportUrl({ applicationId, layerId, outputFormat, filter });
        // Do not specify a filename, the server should provide a Content-Disposition header with the correct file extension
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return of(true);
      }),
    );
  }

  private showSnackbarMessage(msg?: string) {
    const config: SnackBarMessageOptionsModel = {
      message: msg || $localize `Download started, please check your downloads`,
      duration: 5000,
      showDuration: true,
      showCloseButton: true,
    };
    SnackBarMessageComponent.open$(this.snackBar, config).subscribe();
  }

  private getOutputFormat$(layerId: number, format: SupportedExportFormats): Observable<string | null> {
    return this.getExportCapabilities$(layerId)
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
          }
          return null;
        }),
      );
  }

  private getOutputFormat(supportedFormats: string[], requiredFormats: string[]): string | null {
    return supportedFormats.find(format => requiredFormats.includes(format)) || null;
  }

  private getExportCapabilities$(layerId: number): Observable<string[]> {
    return this.store$.select(selectApplicationId).pipe(
      take(1),
      switchMap(applicationId => {
        if (applicationId === null) {
          return of([]);
        }
        const key = this.getCacheKey(applicationId, layerId);
        const cached = this.cachedFormats.get(key);
        if (cached) {
          return of(cached);
        }
        return this.api.getLayerExportCapabilities$({ applicationId : 1, layerId })
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

  private getCacheKey(applicationId: number, layerId: number): string {
    return `${applicationId}-${layerId}`;
  }

}
