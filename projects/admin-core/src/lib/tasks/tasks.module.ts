import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksHomeComponent } from './tasks-home/tasks-home.component';
import { TasksListComponent } from './tasks-list/tasks-list.component';
import { SharedAdminComponentsModule } from '../shared/components/shared-admin-components.module';
import { MatListItem, MatSelectionList } from '@angular/material/list';
import { SharedModule } from '@tailormap-viewer/shared';
import { provideState } from '@ngrx/store';
import { tasksStateKey } from './state/tasks.state';
import { tasksReducer } from './state/tasks.reducer';
import { TaskDetailsComponent } from './task-details/task-details.component';
import { TaskDetailsRowComponent } from './task-details-row/task-details-row.component';

@NgModule({
  declarations: [
    TasksHomeComponent,
    TasksListComponent,
    TaskDetailsComponent,
    TaskDetailsRowComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    SharedAdminComponentsModule,
    MatListItem,
    MatSelectionList,
  ],
  exports: [
    TasksHomeComponent,
    TasksListComponent,
  ],
  providers: [
    provideState(tasksStateKey, tasksReducer),
  ],
})
export class TasksModule { }
