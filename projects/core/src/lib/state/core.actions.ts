import { createAction, props } from '@ngrx/store';
import { AppLayerModel, AppResponseModel, ComponentModel, MapResponseModel } from '@tailormap-viewer/api';

const prefix = '[Core]';

export const loadApplication = createAction(`${prefix} Load Application`);
export const loadApplicationSuccess = createAction(
  `${prefix} Application Load Success`,
  props<{
    application: AppResponseModel;
    map: MapResponseModel;
    layers: AppLayerModel[];
    components: ComponentModel[];
  }>(),
);
export const loadApplicationFailed = createAction(
  `${prefix} Application Load Failed`,
  props<{ error?: string }>(),
);
