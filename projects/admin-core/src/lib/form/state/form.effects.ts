import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import * as FormsActions from './form.actions';
import { map, catchError, of, filter, switchMap, tap } from 'rxjs';
import {
  ApiResponseHelper,
  TailormapAdminApiV1Service,
} from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectFormsLoadStatus } from './form.selectors';

@Injectable()
export class FormEffects {

  public loadForms$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FormsActions.loadForms),
      concatLatestFrom(() => this.store$.select(selectFormsLoadStatus)),
      filter(([ _action, loadStatus ]) => loadStatus !== LoadingStateEnum.LOADED && loadStatus !== LoadingStateEnum.LOADING),
      tap(() => this.store$.dispatch(FormsActions.loadFormsStart())),
      switchMap(([_action]) => {
        return this.adminApiService.getForms$()
          .pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.application.error-loading-applications:Error while loading list of applications` });
            }),
            map(response => {
              if (ApiResponseHelper.isErrorResponse(response)) {
                return FormsActions.loadFormsFailed({ error: response.error });
              }
              return FormsActions.loadFormsSuccess({ forms: response });
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
