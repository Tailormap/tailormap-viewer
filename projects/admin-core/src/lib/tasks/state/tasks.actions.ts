import { createAction, props } from '@ngrx/store';
import { TaskDetailsModel, TaskModel } from '@tailormap-admin/admin-api';

const tasksActionsPrefix = '[Admin/Tasks]';

export const loadTasks = createAction(
  `${tasksActionsPrefix} Load Tasks`,
);

export const loadTasksSuccess = createAction(
  `${tasksActionsPrefix}  Load Tasks Success`,
  props<{ tasks: TaskModel[] }>(),
);

export const loadTasksFailed = createAction(
  `${tasksActionsPrefix}  Load Tasks Failed`,
  props<{ error?: string }>(),
);

export const loadTaskDetails = createAction(
  `${tasksActionsPrefix} Load Task Details`,
  props<{ taskUuid: string; taskType: string }>(),
);

export const loadTaskDetailsFailed = createAction(
  `${tasksActionsPrefix} Load Task Details Failed`,
  props<{ error?: string }>(),
);

export const loadTaskDetailsSuccess = createAction(
  `${tasksActionsPrefix} Load Task Details Success`,
  props<{ taskDetails: TaskDetailsModel }>(),
);

export const startMonitoringTask = createAction(
  `${tasksActionsPrefix} Start Monitoring Task`,
);

export const stopMonitoringTask = createAction(
  `${tasksActionsPrefix} Stop Monitoring Task`,
);

export const deleteTask = createAction(
  `${tasksActionsPrefix} Delete Task`,
  props<{ taskUuid: string; taskType: string }>(),
);

export const deleteTaskFailed = createAction(
  `${tasksActionsPrefix} Delete Task Failed`,
  props<{ error?: string }>(),
);

export const deleteTaskSuccess = createAction(
  `${tasksActionsPrefix} Delete Task Success`,
  props<{ taskUuid: string }>(),
);
