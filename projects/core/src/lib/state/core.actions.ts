import { createAction, props } from '@ngrx/store';
import { ViewerResponseModel, ViewerStylingModel } from '@tailormap-viewer/api';

const prefix = '[Core]';

export const loadViewer = createAction(
  `${prefix} Load Viewer`,
  props<{ id?: string }>(),
);
export const loadViewerSuccess = createAction(
  `${prefix} Viewer Load Success`,
  props<{ viewer: ViewerResponseModel }>(),
);
export const loadViewerFailed = createAction(
  `${prefix} Viewer Load Failed`,
  props<{ error?: string }>(),
);
export const setRouteBeforeLogin = createAction(
  `${prefix} Set Route Before Login`,
  props<{ route: string }>(),
);
export const setLoginDetails = createAction(
  `${prefix} Set Login Details`,
  props<{ isAuthenticated: boolean; username?: string; roles?: string[] }>(),
);
export const setInsufficientRights = createAction(
  `${prefix} Set Insufficient Rights`,
  props<{ hasInsufficientRights: boolean }>(),
);
export const updateViewerStyle = createAction(
  `${prefix} Update Viewer Style`,
  props<{ style: ViewerStylingModel }>(),
);
