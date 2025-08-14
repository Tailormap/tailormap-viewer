import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, take, tap } from 'rxjs';
import { ApiResponseHelper, TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import * as TasksActions from './tasks.actions';
import { selectTaskDetailsLoadStatus, selectTasksLoadStatus } from './tasks.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { loadTaskDetailsStart, loadTasksStart } from './tasks.actions';

@Injectable()
export class TasksEffects {
  private actions$ = inject(Actions);
  private store$ = inject(Store);
  private adminApiService = inject(TAILORMAP_ADMIN_API_V1_SERVICE);


  public loadTasks$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TasksActions.loadTasks),
      tap(() => {
        this.store$.select(selectTasksLoadStatus).pipe(take(1)).subscribe(
          (loadStatus) => {
            if (loadStatus !== LoadingStateEnum.LOADED) {
              this.store$.dispatch(loadTasksStart());
            }
          },
        );
      }),
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
      tap(() => {
        this.store$.select(selectTaskDetailsLoadStatus).pipe(take(1)).subscribe(
          (loadStatus) => {
            if (loadStatus !== LoadingStateEnum.LOADED) {
              this.store$.dispatch(loadTaskDetailsStart());
            }
          },
        );
      }),
      switchMap( action => {
        return this.adminApiService.getTaskDetails$(action.taskUuid, action.taskType)
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

}
