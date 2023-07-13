import { Inject, Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import * as OIDCConfigurationActions from './oidc-configuration.actions';
import { map, catchError, of, filter, switchMap, tap } from 'rxjs';
import {
  OIDCConfigurationModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectOIDCConfigurationsLoadStatus } from './oidc-configuration.selectors';

type ErrorResponse = { error: string };

@Injectable()
export class OIDCConfigurationEffects {

  public loadOIDCConfigurations$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(OIDCConfigurationActions.loadOIDCConfigurations),
      concatLatestFrom(() => this.store$.select(selectOIDCConfigurationsLoadStatus)),
      filter(([ _action, loadStatus ]) => loadStatus !== LoadingStateEnum.LOADED && loadStatus !== LoadingStateEnum.LOADING),
      tap(() => this.store$.dispatch(OIDCConfigurationActions.loadOIDCConfigurationsStart())),
      switchMap(([_action]) => {
        return this.adminApiService.getOIDCConfigurations$()
          .pipe(
            catchError(() => {
              return of({ error: $localize `Error while loading list of OIDC configurations` });
            }),
            map(response => {
              const isErrorResponse = (res: OIDCConfigurationModel[] | ErrorResponse): res is ErrorResponse => {
                return typeof (res as ErrorResponse).error !== 'undefined';
              };
              if (isErrorResponse(response)) {
                return OIDCConfigurationActions.loadOIDCConfigurationsFailed({ error: response.error });
              }
              return OIDCConfigurationActions.loadOIDCConfigurationsSuccess({ oidcConfigurations: response });
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
