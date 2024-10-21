import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksHomeComponent } from './tasks-home/tasks-home.component';
import { TasksListComponent } from './tasks-list/tasks-list.component';
import { SharedAdminComponentsModule } from '../shared/components/shared-admin-components.module';
import { MatListItem, MatSelectionList } from '@angular/material/list';
import { Router } from '@angular/router';



@NgModule({
  declarations: [
    TasksHomeComponent,
    TasksListComponent,
  ],
  imports: [
    CommonModule,
    SharedAdminComponentsModule,
    MatListItem,
    MatSelectionList,
  ],
  exports: [
    TasksHomeComponent,
    TasksListComponent,
  ]
})
export class TasksModule { }
