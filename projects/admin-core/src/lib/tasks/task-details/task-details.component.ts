import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TaskModel } from '@tailormap-admin/admin-api';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'tm-admin-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsComponent implements OnInit {

  public task$: Observable<TaskModel | null> = of(null);

  constructor(
    private route: ActivatedRoute,
  ) { }

  public ngOnInit(): void {
  }

}
