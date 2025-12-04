import { inject, Injectable } from '@angular/core';
import { catchError, combineLatest, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectViewerId } from '../../../state/core.selectors';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileHelper, SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { DateTime } from 'luxon';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { GetLayerExportResponse } from '../models/attribute-list-api-service.model';
import { Sortorder } from '@tailormap-viewer/api';

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
  private store$ = inject(Store);
  private snackBar = inject(MatSnackBar);
  private managerService = inject(AttributeListManagerService);
  private dateLocale = inject(MAT_DATE_LOCALE);
  private static CSV_FORMATS = [ 'csv', 'text/csv' ];
  private static XLSX_FORMATS = [ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'excel2007' ];
  private static SHAPE_FORMATS = [ 'application/vnd.shp', 'application/x-zipped-shp', 'SHAPE-ZIP' ];
  private static GEOPACKAGE_FORMATS = [ 'application/geopackage+sqlite3', 'application/x-gpkg', 'geopackage', 'geopkg', 'gpkg' ];
  private static GEOJSON_FORMATS = [ 'application/geo+json', 'application/geojson', 'application/json', 'json' ];
  private static DXF_FORMATS = ['DXF-ZIP'];

  private cachedFormats: Map<string, string[]> = new Map();

  public getExportFormats$(tabSourceId: string, layerId: string): Observable<SupportedExportFormats[]> {
    return this.getExportCapabilities$(tabSourceId, layerId).pipe(
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
    tabSourceId: string;
    layerId: string;
    serviceLayerName: string;
    format: SupportedExportFormats;
    filter: string | undefined;
    sort: { column: string; direction: string } | null;
    attributes: string[];
  }): Observable<boolean> {
    return combineLatest([
      this.getOutputFormat$(params.tabSourceId, params.layerId, params.format),
      this.store$.select(selectViewerId),
    ]).pipe(
      take(1),
      switchMap(([ outputFormat, applicationId ]) => {
        const defaultErrorMessage = $localize `:@@core.attribute-list.export-failed:Exporting data for layer ${params.serviceLayerName} and format ${params.format} failed`;
        if (applicationId === null || outputFormat === null) {
          this.showSnackbarMessage(defaultErrorMessage);
          return of(null);
        }
        const sortOrder: Sortorder = params.sort?.direction === 'asc' ? Sortorder.ASC : Sortorder.DESC;
        return this.managerService.getLayerExport$(params.tabSourceId, {
          applicationId,
          layerId: params.layerId,
          outputFormat,
          filter: params.filter,
          sortBy: params.sort ? params.sort.column : undefined,
          sortOrder: params.sort ? sortOrder : undefined,
          attributes: params.attributes,
        })
          .pipe(
            catchError(() => {
              this.showSnackbarMessage(defaultErrorMessage);
              return of(null);
            }),
          );
      }),
      tap((response: GetLayerExportResponse | null) => {
        if (!response || !response.file) {
          return;
        }
        const date = DateTime.now().setLocale((this.dateLocale as string)).toLocaleString(DateTime.DATETIME_SHORT).replace(/,? /g, '_');
        const defaultFilename = [ $localize `:@@core.attribute-list.export:Export`, params.serviceLayerName, date ].join('_') + '.' + this.getExtensionForFormat(params.format);
        FileHelper.saveAsFile(response.file, response.fileName || defaultFilename);
      }),
      map((response: GetLayerExportResponse | null) => {
        return !!(response && response.file);
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

  private getOutputFormat$(tabSourceId: string, layerId: string, format: SupportedExportFormats): Observable<string | null> {
    return this.getExportCapabilities$(tabSourceId, layerId)
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

  private getExportCapabilities$(tabSourceId: string, layerId: string): Observable<string[]> {
    return this.store$.select(selectViewerId).pipe(
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
        return this.managerService.getLayerExportCapabilities$(tabSourceId, { applicationId, layerId })
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

  private getCacheKey(applicationId: string, layerId: string): string {
    return `${applicationId}-${layerId}`;
  }

}
