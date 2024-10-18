import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksHomeComponent } from './tasks-home/tasks-home.component';
import { TasksListComponent } from './tasks-list/tasks-list.component';
import { SharedAdminComponentsModule } from '../shared/components/shared-admin-components.module';
import { MatListItem, MatSelectionList } from '@angular/material/list';
import { SharedModule } from '@tailormap-viewer/shared';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { tasksStateKey } from './state/tasks.state';
import { tasksReducer } from './state/tasks.reducer';
import { TasksEffects } from './state/tasks.effects';
import { TaskDetailsComponent } from './task-details/task-details.component';

@NgModule({
  declarations: [
    TasksHomeComponent,
    TasksListComponent,
    TaskDetailsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    SharedAdminComponentsModule,
    StoreModule.forFeature(tasksStateKey, tasksReducer),
    EffectsModule.forFeature([TasksEffects]),
    MatListItem,
    MatSelectionList,
  ],
  exports: [
    TasksHomeComponent,
    TasksListComponent,
  ],
})
export class TasksModule { }
