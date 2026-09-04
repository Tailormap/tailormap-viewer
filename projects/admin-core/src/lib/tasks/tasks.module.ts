import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksHomeComponent } from './tasks-home/tasks-home.component';
import { TasksListComponent } from './tasks-list/tasks-list.component';

import { MatListItem, MatSelectionList } from '@angular/material/list';

import { provideState } from '@ngrx/store';
import { tasksStateKey } from './state/tasks.state';
import { tasksReducer } from './state/tasks.reducer';
import { TaskDetailsComponent } from './task-details/task-details.component';
import { TaskDetailsRowComponent } from './task-details-row/task-details-row.component';

@NgModule({
    imports: [
    CommonModule,
    MatListItem,
    MatSelectionList,
    TasksHomeComponent,
    TasksListComponent,
    TaskDetailsComponent,
    TaskDetailsRowComponent,
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
