import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { TaskDetailsModel, TaskModel } from '@tailormap-admin/admin-api';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { loadTaskDetails } from '../state/tasks.actions';
import { selectTask, selectTaskDetails } from '../state/tasks.selectors';

@Component({
  selector: 'tm-admin-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsComponent implements OnInit {

  public task$: Observable<TaskModel | null> = of(null);
  public uuid$: Observable<string | null> = of(null);
  public taskDetails$: Observable<TaskDetailsModel | null> = of(null);


  constructor(
    private route: ActivatedRoute,
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.uuid$ = this.route.paramMap.pipe(
      map(params => params.get('taskId'))
    );

    this.uuid$.subscribe(
      uuid => {
        this.task$ = this.store$.select(selectTask(uuid));
        this.taskDetails$ = this.store$.select(selectTaskDetails(uuid));
      }
    )



  }

}
