import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, catchError, of, switchMap, tap } from 'rxjs';
import {
  ApiResponseHelper,
  TailormapAdminApiV1Service,
} from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import * as TasksActions from './tasks.actions';

@Injectable()
export class TasksEffects {

  public loadTasks$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TasksActions.loadTasks),
      tap(() => this.store$.dispatch(TasksActions.loadTasksStart())),
      switchMap( _action => {
        return this.adminApiService.getTasks$()
          .pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.tasks.error-loading-tasks:Error while loading list of tasks` });
            }),
            map(response => {
              if (ApiResponseHelper.isErrorResponse(response)) {
                return TasksActions.loadTasksFailed({ error: response.error });
              }
              return TasksActions.loadTasksSuccess({ tasks: response });
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
