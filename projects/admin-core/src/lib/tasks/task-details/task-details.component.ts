import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, DestroyRef } from '@angular/core';
import { distinctUntilChanged, filter, map, Observable, of, take, tap } from 'rxjs';
import { TaskDetailsModel, TaskModel } from '@tailormap-admin/admin-api';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  selectDeleteTaskError, selectTask, selectTaskDetails, selectTaskDetailsLoadError, selectTaskDetailsLoadStatus,
} from '../state/tasks.selectors';
import { TaskMonitoringService } from '../services/task-monitoring.service';
import { ConfirmDialogService, LoadingStateEnum } from '@tailormap-viewer/shared';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css'],
  providers: [ DatePipe, TaskMonitoringService ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsComponent implements OnInit, OnDestroy {

  public task$: Observable<TaskModel | null> = of(null);
  public uuid$: Observable<string | null> = of(null);
  public taskDetails$: Observable<TaskDetailsModel | undefined> = of(undefined);
  public loadErrorMessage$: Observable<string | undefined> = of(undefined);
  public deleteErrorMessage$: Observable<string | undefined> = of(undefined);
  public taskDetailsLoadStatus$: Observable<LoadingStateEnum> = of(LoadingStateEnum.INITIAL);

  private jobDataNiceTitles: Record<string, string> = {
    lastExecutionFinished: 'Last time task was finished',
    lastResult: 'Last result',
  };


  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private taskMonitoringService: TaskMonitoringService,
    private confirmDelete: ConfirmDialogService,
    private router: Router,
    private datePipe: DatePipe,
    private destroyRef: DestroyRef,
  ) {

  }

  public ngOnInit(): void {

    this.uuid$ = this.route.paramMap.pipe(
      map(params => params.get('taskId')),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    );

    this.loadErrorMessage$ = this.store$.select(selectTaskDetailsLoadError);
    this.deleteErrorMessage$ = this.store$.select(selectDeleteTaskError);
    this.taskDetailsLoadStatus$ = this.store$.select(selectTaskDetailsLoadStatus);

    this.uuid$.subscribe(
      uuid => {
        this.task$ = this.store$.select(selectTask(uuid));
        if (uuid) { this.taskMonitoringService.startMonitoring(uuid); }
        this.taskDetails$ = this.store$.select(selectTaskDetails);
      },
    );

  }

  public delete(): void {
    this.task$.pipe(take(1))
      .subscribe(
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
              tap(() => this.taskMonitoringService.deleteTask(task.uuid, task.type)),
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
    return this.jobDataNiceTitles[original] ?? original;
  }

  public convertToDateIfPossible(original: string): string {
    if (!isNaN(Date.parse(original)) && isNaN(Number(original))) {
      return <string>this.datePipe.transform(original, 'medium');
    }
    return original;
  }

  protected readonly loadingStateEnum = LoadingStateEnum;
}
