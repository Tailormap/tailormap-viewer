import { Inject, Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import * as ApplicationActions from './application.actions';
import { map, catchError, of, filter, switchMap, tap } from 'rxjs';
import { ApplicationModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectApplicationsLoadStatus } from './application.selectors';

type ErrorResponse = { error: string };

@Injectable()
export class ApplicationEffects {

  public loadApplication$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ApplicationActions.loadApplications),
      concatLatestFrom(() => this.store$.select(selectApplicationsLoadStatus)),
      filter(([ _action, loadStatus ]) => loadStatus !== LoadingStateEnum.LOADED && loadStatus !== LoadingStateEnum.LOADING),
      tap(() => this.store$.dispatch(ApplicationActions.loadApplicationsStart())),
      switchMap(([_action]) => {
        return this.adminApiService.getApplications$()
          .pipe(
            catchError(() => {
              return of({ error: $localize `Error while loading list of applications` });
            }),
            map(response => {
              const isErrorResponse = (res: ApplicationModel[] | ErrorResponse): res is ErrorResponse => {
                return typeof (res as ErrorResponse).error !== 'undefined';
              };
              if (isErrorResponse(response)) {
                return ApplicationActions.loadApplicationsFailed({ error: response.error });
              }
              return ApplicationActions.loadApplicationsSuccess({ applications: response });
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
