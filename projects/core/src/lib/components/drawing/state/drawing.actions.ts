import { createAction, props } from '@ngrx/store';
import { DrawingFeatureModel, DrawingFeatureStyleModel } from '../models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';

const drawingActionsPrefix = '[Drawing]';

export const addFeature = createAction(
  `${drawingActionsPrefix} Add Feature`,
  props<{ feature: DrawingFeatureModel; selectFeature?: boolean }>(),
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

export const removeDrawingFeature = createAction(
  `${drawingActionsPrefix} Remove Drawing Feature`,
  props<{ fid: string }>(),
);

export const removeAllDrawingFeatures = createAction(
  `${drawingActionsPrefix} Remove All Drawing Features`,
);

export const setSelectedDrawingStyle = createAction(
  `${drawingActionsPrefix} Set Selected Drawing Style`,
  props<{ drawingType: DrawingFeatureTypeEnum | null }>(),
);
