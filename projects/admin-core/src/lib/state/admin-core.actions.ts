import { createAction, props } from '@ngrx/store';

const adminCoreActionsPrefix = '[AdminCore]';

export const setRouteBeforeLogin = createAction(
  `${adminCoreActionsPrefix} Set Route Before Login`,
  props<{ route: string }>(),
);

export const setLoginDetails = createAction(
  `${adminCoreActionsPrefix} Set Login Details`,
  props<{ isAuthenticated: boolean; username?: string; roles?: string[] }>(),
);

export const setInsufficientRights = createAction(
  `${adminCoreActionsPrefix} Set Insufficient Rights`,
  props<{ hasInsufficientRights: boolean }>(),
);
