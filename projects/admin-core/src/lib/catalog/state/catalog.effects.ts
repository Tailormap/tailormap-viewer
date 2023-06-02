import { Inject, Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import * as CatalogActions from './catalog.actions';
import { map, catchError, of, filter, switchMap, tap } from 'rxjs';
import {
  CatalogNodeModel, FeatureSourceModel, GeoServiceWithLayersModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { selectCatalogLoadStatus, selectFeatureSourceLoadStatus, selectGeoServicesLoadStatus } from './catalog.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

type ErrorResponse = { error: string };

@Injectable()
export class CatalogEffects {

  public loadCatalog$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CatalogActions.loadCatalog),
      concatLatestFrom(() => this.store$.select(selectCatalogLoadStatus)),
      filter(([ _action, loadStatus ]) => loadStatus !== LoadingStateEnum.LOADED && loadStatus !== LoadingStateEnum.LOADING),
      tap(() => this.store$.dispatch(CatalogActions.loadCatalogStart())),
      switchMap(([_action]) => {
        return this.adminApiService.getCatalog$()
          .pipe(
            catchError(() => {
              return of({ error: $localize `Error while loading catalog` });
            }),
            map(response => {
              const isErrorResponse = (res: CatalogNodeModel[] | ErrorResponse): res is ErrorResponse => {
                return typeof (res as ErrorResponse).error !== 'undefined';
              };
              if (isErrorResponse(response)) {
                return CatalogActions.loadCatalogFailed({ error: response.error });
              }
              return CatalogActions.loadCatalogSuccess({ nodes: response });
            }),
          );
      }),
    );
  });

  public loadFeatureSources$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CatalogActions.loadFeatureSources),
      concatLatestFrom(() => this.store$.select(selectFeatureSourceLoadStatus)),
      filter(([ _action, loadStatus ]) => loadStatus !== LoadingStateEnum.LOADED && loadStatus !== LoadingStateEnum.LOADING),
      tap(() => this.store$.dispatch(CatalogActions.loadFeatureSourcesStart())),
      switchMap(([_action]) => {
        return this.adminApiService.getAllFeatureSources$()
          .pipe(
            catchError(() => {
              return of({ error: $localize `Error while loading feature sources` });
            }),
            map(response => {
              const isErrorResponse = (res: FeatureSourceModel[] | ErrorResponse): res is ErrorResponse => {
                return typeof (res as ErrorResponse).error !== 'undefined';
              };
              if (isErrorResponse(response)) {
                return CatalogActions.loadFeatureSourcesFailed({ error: response.error });
              }
              return CatalogActions.loadFeatureSourcesSuccess({ featureSources: response });
            }),
          );
      }),
    );
  });

  public loadGeoServices$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CatalogActions.loadAllGeoServices),
      concatLatestFrom(() => this.store$.select(selectGeoServicesLoadStatus)),
      filter(([ _action, loadStatus ]) => loadStatus !== LoadingStateEnum.LOADED && loadStatus !== LoadingStateEnum.LOADING),
      tap(() => this.store$.dispatch(CatalogActions.loadAllGeoServicesStart())),
      switchMap(([ _action, _loadStatus ]) => {
        return this.adminApiService.getAllGeoServices$()
          .pipe(
            catchError(() => {
              return of({ error: $localize `Error while loading geo services` });
            }),
            map((response: GeoServiceWithLayersModel[] | ErrorResponse) => {
              const isErrorResponse = (res: GeoServiceWithLayersModel[] | ErrorResponse): res is ErrorResponse => {
                return typeof (res as ErrorResponse).error !== 'undefined';
              };
              if (isErrorResponse(response)) {
                return CatalogActions.loadAllGeoServicesFailed({ error: response.error });
              }
              return CatalogActions.loadAllGeoServicesSuccess({ services: response });
            }),
          );
      }),
    );
  });

  constructor(
    private actions$: Actions,
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
  ) {}

}
