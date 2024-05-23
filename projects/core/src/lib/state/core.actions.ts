import { createAction, props } from '@ngrx/store';
import { SecurityPropertyModel, ViewerResponseModel, ViewerStylingModel } from '@tailormap-viewer/api';

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
export const setLoginDetails = createAction(
  `${prefix} Set Login Details`,
  props<{
    isAuthenticated: boolean;
    username?: string;
    roles?: string[];
    properties?: SecurityPropertyModel[];
    groupProperties?: SecurityPropertyModel[];
  }>(),
);
export const updateViewerStyle = createAction(
  `${prefix} Update Viewer Style`,
  props<{ style: ViewerStylingModel }>(),
);
