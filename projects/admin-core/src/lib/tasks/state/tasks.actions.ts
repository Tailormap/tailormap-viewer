import { createAction, props } from '@ngrx/store';
import { TaskSchedule } from '@tailormap-admin/admin-api';

const tasksActionsPrefix = '[Admin/Tasks]';

export const loadTasks = createAction(
  `${tasksActionsPrefix} Load Tasks`,
);

export const loadTasksStart = createAction(
  `${tasksActionsPrefix} Load Tasks Start`,
);

export const loadTasksSuccess = createAction(
  `${tasksActionsPrefix}  Load Tasks Success`,
  props<{ tasks: TaskSchedule[] }>(),
);

export const loadTasksFailed = createAction(
  `${tasksActionsPrefix}  Load Tasks Failed`,
  props<{ error?: string }>(),
);
