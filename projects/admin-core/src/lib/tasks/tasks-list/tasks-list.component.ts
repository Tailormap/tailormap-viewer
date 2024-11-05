import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TaskModel } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { loadTasks } from '../state/tasks.actions';
import { selectTasks, selectTasksLoadError } from '../state/tasks.selectors';


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
  ) {
    this.updateTasksInterval = setInterval(
      () => this.store$.dispatch(loadTasks()),
      5000,
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
