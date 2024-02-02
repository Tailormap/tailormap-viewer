import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import * as CatalogActions from './catalog.actions';
import { map, catchError, of, filter, switchMap, tap, forkJoin } from 'rxjs';
import {
  ApiResponseHelper, TailormapAdminApiV1Service,
} from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import {
  selectCatalogLoadStatus, selectDraftFeatureSource, selectDraftFeatureSourceId, selectDraftFeatureSourceLoadStatus, selectDraftGeoService,
  selectDraftGeoServiceId,
  selectDraftGeoServiceLoadStatus,
} from './catalog.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

@Injectable()
export class CatalogEffects {

  public loadCatalog$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CatalogActions.loadCatalog),
      concatLatestFrom(() => this.store$.select(selectCatalogLoadStatus)),
      filter(([ _action, loadStatus ]) => loadStatus !== LoadingStateEnum.LOADED && loadStatus !== LoadingStateEnum.LOADING),
      tap(() => this.store$.dispatch(CatalogActions.loadCatalogStart())),
      switchMap(([_action]) => {
        return forkJoin([
          this.adminApiService.getCatalog$().pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.catalog.error-loading-catalog:Error while loading catalog` });
            }),
          ),
          this.adminApiService.getGeoServiceSummaries$().pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.catalog.error-loading-geo-services:Error while loading geo services` });
            }),
          ),
          this.adminApiService.getFeatureSourceSummaries$().pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.catalog.error-loading-feature-sources:Error while loading feature sources` });
            }),
          ),
        ])
          .pipe(
            map(([ catalogResponse, geoServiceResponse, featureSourceResponse ]) => {
              if (
                ApiResponseHelper.isErrorResponse(catalogResponse) ||
                ApiResponseHelper.isErrorResponse(geoServiceResponse) ||
                ApiResponseHelper.isErrorResponse(featureSourceResponse)
              ) {
                return CatalogActions.loadCatalogFailed({
                  catalogError: ApiResponseHelper.isErrorResponse(catalogResponse) ? catalogResponse.error : '',
                  geoServiceError: ApiResponseHelper.isErrorResponse(geoServiceResponse) ? geoServiceResponse.error : '',
                  featureSourceError: ApiResponseHelper.isErrorResponse(featureSourceResponse) ? featureSourceResponse.error : '',
                });
              }
              return CatalogActions.loadCatalogSuccess({
                nodes: catalogResponse,
                geoServices: geoServiceResponse,
                featureSources: featureSourceResponse,
              });
            }),
          );
      }),
    );
  });

  public loadDraftGeoService$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CatalogActions.loadDraftGeoService),
      concatLatestFrom(() => [
        this.store$.select(selectDraftGeoService),
        this.store$.select(selectDraftGeoServiceId),
        this.store$.select(selectDraftGeoServiceLoadStatus),
      ]),
      filter(([ action, currentDraft, draftLoadingId, draftLoadingStatus ]) => {
        if (currentDraft?.id === action.id) {
          return false;
        }
        if (draftLoadingId === action.id && draftLoadingStatus === LoadingStateEnum.LOADING) {
          return false;
        }
        return true;
      }),
      tap(() => this.store$.dispatch(CatalogActions.loadDraftGeoServiceStart())),
      switchMap(([action]) => {
        return this.adminApiService.getGeoService$({ id: action.id })
          .pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.catalog.error-loading-geo-services:Error while loading geo services` });
            }),
            map(geoServiceResponse => {
              if (ApiResponseHelper.isErrorResponse(geoServiceResponse)) {
                return CatalogActions.loadDraftGeoServiceFailed({
                  error: geoServiceResponse.error,
                });
              }
              return CatalogActions.loadDraftGeoServiceSuccess({
                geoService: geoServiceResponse,
              });
            }),
          );
      }),
    );
  });

  public loadDraftFeatureSource$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CatalogActions.loadDraftFeatureSource),
      concatLatestFrom(() => [
        this.store$.select(selectDraftFeatureSource),
        this.store$.select(selectDraftFeatureSourceId),
        this.store$.select(selectDraftFeatureSourceLoadStatus),
      ]),
      filter(([ action, currentDraft, draftLoadingId, draftLoadingStatus ]) => {
        if (`${currentDraft?.id}` === action.id) {
          return false;
        }
        if (draftLoadingId === action.id && draftLoadingStatus === LoadingStateEnum.LOADING) {
          return false;
        }
        return true;
      }),
      tap(() => this.store$.dispatch(CatalogActions.loadDraftFeatureSourceStart())),
      filter(([ action, currentDraft ]) => currentDraft?.id !== action.id),
      switchMap(([action]) => {
        return this.adminApiService.getFeatureSource$({ id: action.id })
          .pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.catalog.error-loading-feature-sources:Error while loading feature sources` });
            }),
            map(featureSourceResponse => {
              if (ApiResponseHelper.isErrorResponse(featureSourceResponse)) {
                return CatalogActions.loadDraftFeatureSourceFailed({
                  error: featureSourceResponse.error,
                });
              }
              return CatalogActions.loadDraftFeatureSourceSuccess({
                featureSource: featureSourceResponse,
              });
            }),
          );
      }),
    );
  });

  constructor(
    private actions$: Actions,
    private store$: Store,
    private adminApiService: TailormapAdminApiV1Service,
  ) {}

}
