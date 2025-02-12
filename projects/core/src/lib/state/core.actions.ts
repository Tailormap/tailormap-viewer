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
export const updateViewerStyle = createAction(
  `${prefix} Update Viewer Style`,
  props<{ style: ViewerStylingModel }>(),
);
export const setComponentEnabled = createAction(
  `${prefix} Set Component Enabled`,
  props<{ componentType: string; enabled: boolean }>(),
);
