import { createAction, props } from '@ngrx/store';

const tasksActionsPrefix = '[Admin/Tasks]';

export const loadForms = createAction(
  `${tasksActionsPrefix} Load Forms`,
);
