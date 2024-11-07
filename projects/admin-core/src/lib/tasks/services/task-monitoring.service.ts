import { DestroyRef, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, catchError, first, interval, map, of } from 'rxjs';
import { selectTask } from '../state/tasks.selectors';
import { loadTaskDetails } from '../state/tasks.actions';
import { ApiResponseHelper, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as TasksActions from '../state/tasks.actions';

@Injectable()
export class TaskMonitoringService {

  private uuid$ = new BehaviorSubject<string>('');
  private type$ = new BehaviorSubject<string> ('');
  private monitoring$ = new BehaviorSubject<boolean>(false);

  constructor(
    private store$: Store,
    private adminApiService: TailormapAdminApiV1Service,
    private destroyRef: DestroyRef,
  ) {
    interval(1000).pipe(takeUntilDestroyed(destroyRef)).subscribe(
      () => {
        if (this.uuid$.value && this.type$.value && this.monitoring$) {
          this.store$.dispatch(loadTaskDetails({ taskUuid: this.uuid$.value, taskType: this.type$.value }));
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
          this.store$.dispatch(loadTaskDetails({ taskUuid: uuid, taskType: task.type }));
        }
      },
    );
  }

  public stopMonitoring() {
    this.monitoring$.next(false);
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

  public deleteTask(uuid: string, type: string ) {
    this.adminApiService.deleteTask$(uuid, type)
      .pipe(
        catchError(() => {
          return of({ error: $localize `:@@admin-core.tasks.error-deleting-task:Error while deleting task` });
        }),
        map(response => {
          if (ApiResponseHelper.isErrorResponse(response)) {
            return TasksActions.deleteTaskFailed({ error: response.error });
          }
          return TasksActions.deleteTaskSuccess({ taskUuid: this.uuid$.value });
        }),
      ).subscribe();
  }

}
