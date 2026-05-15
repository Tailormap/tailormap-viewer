import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import * as ApplicationActions from './application.actions';
import { map, catchError, of, filter, switchMap, tap } from 'rxjs';
import {
  ApiResponseHelper,
  TailormapAdminApiV1Service,
} from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectApplicationsLoadStatus } from './application.selectors';

@Injectable()
export class ApplicationEffects {
  private actions$ = inject(Actions);
  private store$ = inject(Store);
  private adminApiService = inject(TailormapAdminApiV1Service);


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
              return of({ error: $localize `:@@admin-core.application.error-loading-applications:Error while loading list of applications` });
            }),
            map(response => {
              if (ApiResponseHelper.isErrorResponse(response)) {
                return ApplicationActions.loadApplicationsFailed({ error: response.error });
              }
              return ApplicationActions.loadApplicationsSuccess({ applications: response });
            }),
          );
      }),
    );
  });

}
