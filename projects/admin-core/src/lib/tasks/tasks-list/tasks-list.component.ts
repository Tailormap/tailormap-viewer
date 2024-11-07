import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, DestroyRef } from '@angular/core';
import { interval, Observable, of } from 'rxjs';
import { TaskModel } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { loadTasks } from '../state/tasks.actions';
import { selectTasks, selectTasksLoadError } from '../state/tasks.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'tm-admin-tasks-list',
  templateUrl: './tasks-list.component.html',
  styleUrls: ['./tasks-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksListComponent implements OnInit, OnDestroy {

  public tasks$: Observable<TaskModel[]> = of([]);
  public errorMessage$: Observable<string | undefined> = of(undefined);
  public updateTasksInterval?: ReturnType<typeof setInterval>;

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
    this.tasks$ = this.store$.select(selectTasks);
    this.errorMessage$ = this.store$.select(selectTasksLoadError);
  }

  public onRetryClick(): void {
    this.store$.dispatch(loadTasks());
  }

  public ngOnDestroy(): void {
    clearInterval(this.updateTasksInterval);
  }

}
