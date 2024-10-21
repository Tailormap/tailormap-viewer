import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { Observable, of } from 'rxjs';
import { TaskSchedule } from '@tailormap-admin/admin-api';
import { Router } from '@angular/router';

@Component({
  selector: 'tm-admin-tasks-list',
  templateUrl: './tasks-list.component.html',
  styleUrls: ['./tasks-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksListComponent implements OnInit {

  public tasks$: Observable<TaskSchedule[]> = of([]);

  constructor(
    private adminApiService: TailormapAdminApiV1Service,
  ) { }

  public ngOnInit(): void {
    this.tasks$ = this.adminApiService.getTasks$();
  }

}
