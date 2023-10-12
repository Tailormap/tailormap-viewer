import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import * as OIDCConfigurationActions from './oidc-configuration.actions';
import { map, catchError, of, filter, switchMap, tap } from 'rxjs';
import {
  OIDCConfigurationModel, TailormapAdminApiV1Service,
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
              return of({ error: $localize `:@@admin-core.oidc.error-loading-configurations:Error while loading list of OIDC configurations` });
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
    private adminApiService: TailormapAdminApiV1Service,
  ) {}

}
