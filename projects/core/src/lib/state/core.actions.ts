import { createAction, props } from '@ngrx/store';
import { AppResponseModel, ComponentModel } from '@tailormap-viewer/api';

const prefix = '[Core]';

export const loadApplication = createAction(
  `${prefix} Load Application`,
  props<{ id?: number; name?: string; version?: string }>(),
);
export const loadApplicationSuccess = createAction(
  `${prefix} Application Load Success`,
  props<{ application: AppResponseModel; components: ComponentModel[]; }>(),
);
export const loadApplicationFailed = createAction(
  `${prefix} Application Load Failed`,
  props<{ error?: string }>(),
);
export const setRouteBeforeLogin = createAction(
  `${prefix} Set Route Before Login`,
  props<{ route: string }>(),
);
export const setLoginDetails = createAction(
  `${prefix} Set Login Details`,
  props<{ loggedIn: boolean; user?: { username?: string } }>(),
);
