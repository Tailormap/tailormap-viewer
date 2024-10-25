import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { TaskDetailsModel, TaskModel } from '@tailormap-admin/admin-api';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectTask, selectTaskDetails } from '../state/tasks.selectors';
import { TaskMonitoringService } from '../services/task-monitoring.service';

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


  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private taskMonitoringService: TaskMonitoringService,
  ) {

  }

  public ngOnInit(): void {

    this.uuid$ = this.route.paramMap.pipe(
      map(params => params.get('taskId')),
    );

    this.uuid$.subscribe(
      uuid => {
        this.task$ = this.store$.select(selectTask(uuid));
        if (uuid) { this.taskMonitoringService.startMonitoring(uuid); }
        this.taskDetails$ = this.store$.select(selectTaskDetails);
      },
    );

  }

  public delete(): void {
    console.log("delete");
  }

  public ngOnDestroy(): void {
    this.taskMonitoringService.stopMonitoring();
  }

}
