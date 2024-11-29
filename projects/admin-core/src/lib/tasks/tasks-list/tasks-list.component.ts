import { Component, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { interval, Observable, of } from 'rxjs';
import { TaskModel } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { loadTasks } from '../state/tasks.actions';
import { selectTasks, selectTasksLoadError, selectTasksLoadStatus } from '../state/tasks.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingStateEnum } from '@tailormap-viewer/shared';


@Component({
  selector: 'tm-admin-tasks-list',
  templateUrl: './tasks-list.component.html',
  styleUrls: ['./tasks-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksListComponent implements OnInit {

  public tasks$: Observable<TaskModel[]> = of([]);
  public errorMessage$: Observable<string | undefined> = of(undefined);
  public tasksLoadStatus$: Observable<LoadingStateEnum> = of(LoadingStateEnum.INITIAL);

  constructor(
    private store$: Store,
    private destroyRef: DestroyRef,
  ) {
    interval(5000).pipe(takeUntilDestroyed(destroyRef)).subscribe(
      () => {
        this.store$.dispatch(loadTasks());
      },
    );
  }

  public ngOnInit(): void {
    this.store$.dispatch(loadTasks());
    this.tasksLoadStatus$ = this.store$.select(selectTasksLoadStatus);
    this.tasks$ = this.store$.select(selectTasks);
    this.errorMessage$ = this.store$.select(selectTasksLoadError);
  }

  public onRetryClick(): void {
    this.store$.dispatch(loadTasks());
  }

  protected readonly loadingStateEnum = LoadingStateEnum;
}
