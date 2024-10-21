import * as FormActions from './tasks.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { TasksState, initialTasksState } from './tasks.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FormModel, FormSummaryModel } from '@tailormap-admin/admin-api';
import { FormFieldTypeEnum } from '@tailormap-viewer/api';

const tasksReducerImpl = createReducer<TasksState>(
  initialTasksState,
);
export const tasksReducer = (state: TasksState | undefined, action: Action) => tasksReducerImpl(state, action);
