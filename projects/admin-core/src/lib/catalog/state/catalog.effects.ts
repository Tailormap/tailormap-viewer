import { Inject, Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import * as CatalogActions from './catalog.actions';
import { map, catchError, of, filter, switchMap } from 'rxjs';
import {
  CatalogNodeModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { selectCatalogLoadStatus } from './catalog.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

type ErrorResponse = { error: string };

@Injectable()
export class CatalogEffects {

  public loadCatalog$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CatalogActions.loadCatalog),
      concatLatestFrom(() => this.store$.select(selectCatalogLoadStatus)),
      filter(([ _action, loadStatus ]) => loadStatus !== LoadingStateEnum.LOADED),
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

  constructor(
    private actions$: Actions,
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
  ) {}

}
