import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, BehaviorSubject, first } from 'rxjs';
import { selectTask } from '../state/tasks.selectors';
import { loadTaskDetails, startMonitoringTask, stopMonitoringTask } from '../state/tasks.actions';
import { TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';

@Injectable({
  providedIn: 'root',
})
export class TaskMonitoringService {

  private uuid$ = new BehaviorSubject<string>('');
  private type$ = new BehaviorSubject<string> ('');
  private monitoring$ = new BehaviorSubject<boolean>(false);
  private monitor?: ReturnType<typeof setInterval>;

  constructor(
    private store$: Store,
    private adminApiService: TailormapAdminApiV1Service,
  ) {
    combineLatest([
      this.uuid$.asObservable(),
      this.monitoring$.asObservable(),
      this.type$.asObservable(),
    ]).subscribe(
      ([ uuid, monitoring, type ]) => {
        if (uuid && monitoring && type) {
          clearInterval(this.monitor);
          this.monitor = setInterval(
            () => this.store$.dispatch(loadTaskDetails({ taskUuid: uuid, taskType: type })),
            1000,
          );
        } else {
          clearInterval(this.monitor);
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
    this.store$.dispatch(startMonitoringTask());
  }

  public stopMonitoring() {
    this.monitoring$.next(false);
    this.store$.dispatch(stopMonitoringTask());
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

}
