import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { interval, Observable, of } from 'rxjs';
import { TaskModel } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { selectTasks, selectTasksLoadError, selectTasksLoadStatus } from '../state/tasks.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { TaskMonitoringService } from '../services/task-monitoring.service';


@Component({
  selector: 'tm-admin-tasks-list',
  templateUrl: './tasks-list.component.html',
  styleUrls: ['./tasks-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TasksListComponent implements OnInit {
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);
  private taskMonitoringService = inject(TaskMonitoringService);


  public tasks$: Observable<TaskModel[]> = of([]);
  public errorMessage$: Observable<string | undefined> = of(undefined);
  public tasksLoadStatus$: Observable<LoadingStateEnum> = of(LoadingStateEnum.INITIAL);

  constructor() {
    const destroyRef = this.destroyRef;

    interval(5000).pipe(takeUntilDestroyed(destroyRef)).subscribe(
      () => {
        this.taskMonitoringService.loadTasks();
      },
    );
  }

  public ngOnInit(): void {
    this.taskMonitoringService.loadTasks();
    this.tasksLoadStatus$ = this.store$.select(selectTasksLoadStatus);
    this.tasks$ = this.store$.select(selectTasks);
    this.errorMessage$ = this.store$.select(selectTasksLoadError);
  }

  public onRetryClick(): void {
    this.taskMonitoringService.loadTasks();
  }

  protected readonly loadingStateEnum = LoadingStateEnum;
}
