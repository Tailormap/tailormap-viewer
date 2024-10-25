import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map, BehaviorSubject } from 'rxjs';
import { selectTask } from '../state/tasks.selectors';
import { loadTaskDetails, startMonitoringTask, stopMonitoringTask } from '../state/tasks.actions';

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
  ) {
    combineLatest([
      this.uuid$,
      this.monitoring$,
      this.type$,
    ]).subscribe(
      ([uuid, monitoring, type]) => {
        console.log(uuid, monitoring, type);
        if (uuid && monitoring && type) {
          clearInterval(this.monitor);
          this.monitor = setInterval(
            () => this.store$.dispatch(loadTaskDetails({ taskUuid: uuid, taskType: type })),
            1000,
          )
        } else {
          clearInterval(this.monitor);
        }

      }
    )
  }

  public startMonitoring(uuid: string) {
    this.uuid$.next(uuid);
    this.monitoring$.next(true);
    this.store$.select(selectTask(uuid)).pipe(
      map(task => task.type)
    ).subscribe(
      type => this.type$.next(type)
    )
    this.store$.dispatch(startMonitoringTask());
  }

  public stopMonitoring() {
    this.monitoring$.next(false);
    this.store$.dispatch(stopMonitoringTask());
  }

}
