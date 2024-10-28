import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
export class TasksListComponent implements OnInit {

  public tasks$: Observable<TaskModel[]> = of([]);
  public errorMessage$: Observable<string | undefined> = of(undefined);

  constructor(
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.store$.dispatch(loadTasks());
    this.tasks$ = this.store$.select(selectTasks);
    this.errorMessage$ = this.store$.select(selectTasksLoadError);
  }

  public onRetryClick(): void {
    this.store$.dispatch(loadTasks());
  }

}
