import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { TaskModel } from '@tailormap-admin/admin-api';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { loadTaskDetails } from '../state/tasks.actions';

@Component({
  selector: 'tm-admin-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsComponent implements OnInit {

  public task$: Observable<TaskModel | null> = of(null);

  public uuid$: Observable<string | null> = of(null);

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.uuid$ = this.route.paramMap.pipe(
      map(params => params.get('taskId'))
    );
  }

}
