import { createAction, props } from '@ngrx/store';
import { MapResponseModel } from '@tailormap-viewer/api';

const mapActionsPrefix = '[Map]';

export const loadMap = createAction(
  `${mapActionsPrefix} Load Map`,
  props<{ id: number }>(),
);
export const loadMapSuccess = createAction(
  `${mapActionsPrefix} Map Load Success`,
  props<MapResponseModel>(),
);
export const loadMapFailed = createAction(
  `${mapActionsPrefix} Map Load Failed`,
  props<{ error?: string }>(),
);
export const setLayerVisibility = createAction(
  `${mapActionsPrefix} Set Layer Visibility`,
  props<{ visibility: Record<number, boolean> }>(),
);
export const setSelectedLayerId = createAction(
  `${mapActionsPrefix} Set Selected Layer ID`,
  props<{ layerId: string }>(),
);
