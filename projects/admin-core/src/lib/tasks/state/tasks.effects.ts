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

  public loadTaskDetails$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TasksActions.loadTaskDetails),
      switchMap( _action => {
        return this.adminApiService.getTaskDetails$(_action.taskUuid, _action.taskType)
          .pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.tasks.error-loading-task-details:Error while loading task details` });
            }),
            map(response => {
              if (ApiResponseHelper.isErrorResponse(response)) {
                return TasksActions.loadTaskDetailsFailed({ error: response.error });
              }
              return TasksActions.loadTaskDetailsSuccess({ taskDetails: response });
            }),
          );
      }),
    );
  });

  public deleteTask$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TasksActions.deleteTask),
      switchMap( _action => {
        return this.adminApiService.deleteTask$(_action.taskUuid, _action.taskType)
          .pipe(
            catchError(() => {
              return of({ error: $localize `:@@admin-core.tasks.error-deleting-task:Error while deleting task` });
            }),
            map(response => {
              if (ApiResponseHelper.isErrorResponse(response)) {
                return TasksActions.deleteTaskFailed({ error: response.error });
              }
              return TasksActions.deleteTaskSuccess({ taskUuid: _action.taskUuid });
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