import { DestroyRef, Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, catchError, first, interval, map, of, take } from 'rxjs';
import { selectTask, selectTaskDetailsLoadStatus, selectTasksLoadStatus } from '../state/tasks.selectors';
import {
  deleteTaskSuccess, loadTaskDetailsFailed, loadTaskDetailsStart, loadTaskDetailsSuccess, loadTasksFailed, loadTasksStart,
  loadTasksSuccess,
} from '../state/tasks.actions';
import { ApiResponseHelper, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

@Injectable({
  providedIn: 'root',
})
export class TaskMonitoringService {
  private store$ = inject(Store);
  private adminApiService = inject(TailormapAdminApiV1Service);
  private adminSnackbarService = inject(AdminSnackbarService);
  private destroyRef = inject(DestroyRef);


  private uuid$ = new BehaviorSubject<string>('');
  private type$ = new BehaviorSubject<string> ('');
  private monitoring$ = new BehaviorSubject<boolean>(false);

  constructor() {
    const destroyRef = this.destroyRef;

    interval(1000).pipe(takeUntilDestroyed(destroyRef)).subscribe(
      () => {
        if (this.uuid$.value && this.type$.value && this.monitoring$) {
          this.loadTaskDetails(this.uuid$.value, this.type$.value);
        }
      },
    );

  }

  public startMonitoring(uuid: string) {
    this.uuid$.next(uuid);
    this.monitoring$.next(true);
    this.store$.select(selectTask(uuid)).pipe(first(task => task !== undefined))
      .subscribe(
      task => {
        if (task) {
          this.type$.next(task.type);
          this.loadTaskDetails(uuid, task.type);
        }
      },
    );
  }

  public stopMonitoring() {
    this.monitoring$.next(false);
  }

  public loadTasks(): void {
    this.store$.select(selectTasksLoadStatus).pipe(take(1)).subscribe(loadStatus => {
      if (loadStatus !== LoadingStateEnum.LOADED) {
        this.store$.dispatch(loadTasksStart());
      }
    });
    this.adminApiService.getTasks$()
      .pipe(
        catchError(() => of({ error: $localize `:@@admin-core.tasks.error-loading-tasks:Error while loading list of tasks` })),
      )
      .subscribe(response => {
        if (ApiResponseHelper.isErrorResponse(response)) {
          this.store$.dispatch(loadTasksFailed({ error: response.error }));
          return;
        }
        this.store$.dispatch(loadTasksSuccess({ tasks: response }));
      });
  }

  public loadTaskDetails(taskUuid: string, taskType: string): void {
    this.store$.select(selectTaskDetailsLoadStatus).pipe(take(1)).subscribe(loadStatus => {
      if (loadStatus !== LoadingStateEnum.LOADED) {
        this.store$.dispatch(loadTaskDetailsStart());
      }
    });
    this.adminApiService.getTaskDetails$(taskUuid, taskType)
      .pipe(
        catchError(() => of({ error: $localize `:@@admin-core.tasks.error-loading-task-details:Error while loading task details` })),
      )
      .subscribe(response => {
        if (ApiResponseHelper.isErrorResponse(response)) {
          this.store$.dispatch(loadTaskDetailsFailed({ error: response.error }));
          return;
        }
        this.store$.dispatch(loadTaskDetailsSuccess({ taskDetails: response }));
      });
  }

  public startTask() {
    if (!this.uuid$.value || !this.type$.value) {
      return;
    }
    this.adminApiService.startTask$(this.uuid$.value, this.type$.value).subscribe();
  }

  public stopTask() {
    if (!this.uuid$.value || !this.type$.value) {
      return;
    }
    this.adminApiService.stopTask$(this.uuid$.value, this.type$.value).subscribe();
  }

  public deleteTask$(uuid: string, type: string ) {
    return this.adminApiService.deleteTask$(uuid, type)
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.tasks.error-deleting-task:Error while deleting task`);
          return of(null);
        }),
        map(response => {
          if (response) {
            this.store$.dispatch(deleteTaskSuccess({ taskUuid: this.uuid$.value }));
            return response;
          }
          return null;
        }),
      );
  }

}
