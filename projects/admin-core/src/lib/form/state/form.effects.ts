import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import * as FormsActions from './form.actions';
import { map, catchError, of, filter, switchMap, tap } from 'rxjs';
import {
  ApiResponseHelper,
  TailormapAdminApiV1Service,
} from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectDraftForm, selectDraftFormId, selectDraftFormLoadStatus, selectFormsLoadStatus } from './form.selectors';

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
              return of({ error: $localize `:@@admin-core.form.error-loading-forms:Error while loading list of forms` });
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

  public loadDraftForm$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FormsActions.loadDraftForm),
      concatLatestFrom(() => [
        this.store$.select(selectDraftForm),
        this.store$.select(selectDraftFormId),
        this.store$.select(selectDraftFormLoadStatus),
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
      tap(() => this.store$.dispatch(FormsActions.loadDraftFormStart())),
      switchMap(([action]) => {
        return this.adminApiService.getForm$(action.id)
          .pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.form.error-loading-form:Error while loading form` });
            }),
            map(formResponse => {
              if (ApiResponseHelper.isErrorResponse(formResponse)) {
                return FormsActions.loadDraftFormFailed({
                  error: formResponse.error,
                });
              }
              return FormsActions.loadDraftFormSuccess({
                form: formResponse,
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
