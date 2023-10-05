import { createAction, props } from '@ngrx/store';

const adminCoreActionsPrefix = '[AdminCore]';

export const setLoginDetails = createAction(
  `${adminCoreActionsPrefix} Set Login Details`,
  props<{ isAuthenticated: boolean; username?: string; roles?: string[] }>(),
);
