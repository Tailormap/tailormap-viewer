import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminPageTemplateComponent } from '../../templates/admin-page-template/admin-page-template.component';
import { TasksListComponent } from '../../tasks/tasks-list/tasks-list.component';

@Component({
    selector: 'tm-admin-tasks-page',
    templateUrl: './tasks-page.component.html',
    styleUrls: ['./tasks-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AdminPageTemplateComponent, TasksListComponent],
})
export class TasksPageComponent {

  constructor() { }

}
