import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject, catchError, combineLatest, filter, first, map, merge, mergeMap, Observable, of, share, startWith, switchMap, take,
  takeUntil, tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import { selectViewerId } from '../../../state/core.selectors';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { ExtractProgressEventsService, EventType, LayerExtractResponseModel, Sortorder } from '@tailormap-viewer/api';
import { LayerFeaturesFilters } from '../../../filter';

export enum SupportedExtractFormats {
  CSV = 'csv',
  SHAPE = 'shape',
  GEOJSON = 'geojson',
  XLSX = 'xlsx',
}

@Injectable({
  providedIn: 'root',
})
export class AttributeListExportService {
  private store$ = inject(Store);
  private snackBar = inject(MatSnackBar);
  private managerService = inject(AttributeListManagerService);
  private extractProgressEventsService = inject(ExtractProgressEventsService);
  private extractProgressSubject= new BehaviorSubject( 0);
  public extractProgress$ = this.extractProgressSubject.asObservable();
  /** the key is created using applicationId and layerId, the data is the list of supported formats.
   * @see #getCacheKey(applicationId, layerId)
   * @private
   */
  private cachedFormats: Map<string, string[]> = new Map();

  public getExportFormats$(tabSourceId: string, layerId: string): Observable<SupportedExtractFormats[]> {
    return this.getExtractCapabilities$(tabSourceId, layerId).pipe(
      map(formats => {
        const enumValues = Object.values(SupportedExtractFormats) as SupportedExtractFormats[];
        return enumValues.filter(fmt => formats.includes(fmt));
      }),
    );
  }

  public export$(params: {
    tabSourceId: string;
    layerId: string;
    serviceLayerName: string;
    format: SupportedExtractFormats;
    filter: LayerFeaturesFilters | undefined;
    sort: { column: string; direction: string } | null;
    attributes: string[];
  }): Observable<boolean> {
    return combineLatest([
      this.getOutputFormat$(params.tabSourceId, params.layerId, params.format),
      this.store$.select(selectViewerId),
    ]).pipe(
      take(1),
      switchMap(([ outputFormat, applicationId ]) => {
        const defaultErrorMessage =
          $localize `:@@core.attribute-list.export-failed:Extracting data for layer ${params.serviceLayerName} and format ${params.format} failed`;
        if (applicationId === null || outputFormat === null) {
          this.showSnackbarMessage(defaultErrorMessage);
          return of(null);
        }
        const sortOrder: Sortorder = params.sort?.direction === 'asc' ? Sortorder.ASC : Sortorder.DESC;

        return this.managerService.startLayerExtract$(params.tabSourceId, {
          clientId: this.extractProgressEventsService.getClientId(),
          applicationId,
          layerId: params.layerId,
          outputFormat,
          filter: params.filter,
          sortBy: params.sort ? params.sort.column : undefined,
          sortOrder: params.sort ? sortOrder : undefined,
          attributes: params.attributes,
        }).pipe(
          catchError(() => {
            this.showSnackbarMessage(defaultErrorMessage);
            return of(null);
          }),
          switchMap((response: LayerExtractResponseModel | null) => {
            // If no response or no downloadId, just pass it through
            if (!response || !response.downloadId) {
              return of(response);
            }
            // shared SSE stream for this downloadId (single underlying subscription)
            const events$ = this.extractProgressEventsService
              .listenForSpecificExtractProgressEvents$(response.downloadId)
              .pipe(share());

            // completedOrFailed$ will emit the first COMPLETED or FAILED event
            const completedOrFailed$ = events$.pipe(
              filter(evt => evt.eventType === EventType.EXTRACT_COMPLETED || evt.eventType === EventType.EXTRACT_FAILED),
              first(),
            );

            // progress$ emits while extraction is running; map each progress emission to the original response
            const progress$ = events$.pipe(
              filter(evt => evt.eventType === EventType.EXTRACT_PROGRESS),
              takeUntil(completedOrFailed$),
              tap(evt => {
                // side effect: relay progress to service's extractProgress$ observable for UI to consume
                this.extractProgressSubject.next(evt.details.progress);
              }),
              // map to response so downstream receives consistent type
              map(() => response),
            );

            // When extraction completes or fails, trigger download or show error — produce response for downstream
            const completionTriggeredDownload$ = completedOrFailed$.pipe(
              mergeMap(evt => {
                const details = evt.details;
                if (evt.eventType === EventType.EXTRACT_COMPLETED) {
                  this.extractProgressSubject.next(100);
                  // trigger the actual download; return an observable that emits the original response when done
                  return this.managerService.downloadLayerExtract$(params.tabSourceId, {
                    layerId: params.layerId,
                    applicationId: applicationId,
                    downloadId: details.downloadId,
                  }).pipe(
                    // on error show snackbar and still return the response
                    catchError(err => {
                      console.error('Error downloading extract', err);
                      this.showSnackbarMessage($localize `:@@core.attribute-list.extract-download-failed:Downloading extract failed`);
                      return of(null);
                    }),
                    // emit the original response regardless of HTTP result so outer map can use it
                    map(() => response));
                } else {
                  // extraction failed -> show message and emit response
                  const msg =
                    $localize`:@@core.attribute-list.export-failed:Extracting data for layer ${params.serviceLayerName} and format ${params.format} failed during extraction`;
                  this.showSnackbarMessage(msg);
                  return of(response);
                }
              }),
            );
            // merge progress notifications and completion-download observable; start with the immediate response
            // that way callers get the initial response quickly and subsequent emissions keep emitting the same response
            return merge(progress$, completionTriggeredDownload$).pipe(startWith(response));
          }),
        );
      }),
      // Convert the final response (possibly emitted multiple times) to boolean
      map((response: LayerExtractResponseModel | null) => !!(response && response.downloadId)),
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

  private getOutputFormat$(tabSourceId: string, layerId: string, format: SupportedExtractFormats): Observable<string | null> {
    return this.getExportFormats$(tabSourceId, layerId)
      .pipe(
        take(1),
        map(formats => (formats.find(fmt => fmt === format) ?? null)),
      );
  }

  private getExtractCapabilities$(tabSourceId: string, layerId: string): Observable<string[]> {
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
        return this.managerService.getLayerExtractCapabilities$(tabSourceId, { applicationId, layerId })
          .pipe(
            catchError(() => of({ outputFormats: [] })),
            tap(capabilities => {
                this.cachedFormats.set(key, capabilities.outputFormats);
            }),
            map(capabilities => capabilities.outputFormats || []),
          );
      }),
    );
  }

  private getCacheKey(applicationId: string, layerId: string): string {
    return `${applicationId}-${layerId}`;
  }
}
