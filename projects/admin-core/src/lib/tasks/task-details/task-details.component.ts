import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { filter, map, Observable, of, take, tap } from 'rxjs';
import { TaskDetailsModel, TaskModel } from '@tailormap-admin/admin-api';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectDeleteTaskError, selectTask, selectTaskDetails, selectTaskDetailsLoadError } from '../state/tasks.selectors';
import { TaskMonitoringService } from '../services/task-monitoring.service';
import { deleteTask } from '../state/tasks.actions';
import { ConfirmDialogService } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsComponent implements OnInit, OnDestroy {

  public task$: Observable<TaskModel | null> = of(null);
  public uuid$: Observable<string | null> = of(null);
  public taskDetails$: Observable<TaskDetailsModel | undefined> = of(undefined);
  public loadErrorMessage$: Observable<string | undefined> = of(undefined);
  public deleteErrorMessage$: Observable<string | undefined> = of(undefined);

  public jobDataNiceTitles = new Map([
    [ 'lastExecutionFinished', 'Last time task was finished' ],
    [ 'lastResult', 'Last result' ],
  ]);


  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private taskMonitoringService: TaskMonitoringService,
    private confirmDelete: ConfirmDialogService,
    private router: Router,
  ) {

  }

  public ngOnInit(): void {

    this.uuid$ = this.route.paramMap.pipe(
      map(params => params.get('taskId')),
    );

    this.loadErrorMessage$ = this.store$.select(selectTaskDetailsLoadError);
    this.deleteErrorMessage$ = this.store$.select(selectDeleteTaskError);

    this.uuid$.subscribe(
      uuid => {
        this.task$ = this.store$.select(selectTask(uuid));
        if (uuid) { this.taskMonitoringService.startMonitoring(uuid); }
        this.taskDetails$ = this.store$.select(selectTaskDetails);
      },
    );

  }

  public delete(): void {
    this.task$.subscribe(
      task => {
        if (task) {
          this.confirmDelete.confirm$(
            $localize `:@@admin-core.tasks.delete-task:Delete task \'${task.description}\'`,
            $localize `:@@admin-core.tasks.delete-task-message:Are you sure you want to delete task \'${task.description}\'? This action cannot be undone.`,
            true,
          )
            .pipe(
              take(1),
              filter(answer => answer),
              tap(() => this.store$.dispatch(deleteTask({ taskUuid: task.uuid, taskType: task.type }))),
            )
            .subscribe(() => {
              this.router.navigateByUrl('/admin/tasks');
            });
        }
      },
    );
  }

  public start(): void {
    this.taskMonitoringService.startTask();
  }

  public stop(): void {
    this.taskMonitoringService.stopTask();
  }

  public ngOnDestroy(): void {
    this.taskMonitoringService.stopMonitoring();
  }

  public niceTitle(original: string): string {
    if (this.jobDataNiceTitles.has(original)) {
      return <string>this.jobDataNiceTitles.get(original);
    } else {
      return original;
    }
  }

}
