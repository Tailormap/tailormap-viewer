import { createAction, props } from '@ngrx/store';
import { DrawingFeatureModel, DrawingFeatureStyleModel } from '../../../map/models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';

const drawingActionsPrefix = '[Drawing]';

export const addFeature = createAction(
  `${drawingActionsPrefix} Add Feature`,
  props<{ feature: DrawingFeatureModel; selectFeature?: boolean }>(),
);

export const addFeatures = createAction(
  `${drawingActionsPrefix} Add Features`,
  props<{ features: DrawingFeatureModel[] }>(),
);

export const removeAllFeatures = createAction(
  `${drawingActionsPrefix} Remove All Features`,
);

export const setSelectedFeature = createAction(
  `${drawingActionsPrefix} Set Selected Feature`,
  props<{ fid: string | null }>(),
);

export const updateDrawingFeatureStyle = createAction(
  `${drawingActionsPrefix} Update Feature Style`,
  props<{ fid: string; style: Partial<DrawingFeatureStyleModel> }>(),
);

export const updateSelectedDrawingFeatureGeometry = createAction(
  `${drawingActionsPrefix} Update Selected Feature Geometry`,
  props<{ geometry: string }>(),
);

export const removeDrawingFeature = createAction(
  `${drawingActionsPrefix} Remove Drawing Feature`,
  props<{ fid: string }>(),
);

export const removeAllDrawingFeatures = createAction(
  `${drawingActionsPrefix} Remove All Drawing Features`,
);

export const setSelectedDrawingType = createAction(
  `${drawingActionsPrefix} Set Selected Drawing Type`,
  props<{ drawingType: DrawingFeatureTypeEnum | null }>(),
);
