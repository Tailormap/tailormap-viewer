import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-tasks-home',
  templateUrl: './tasks-home.component.html',
  styleUrls: ['./tasks-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksHomeComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
