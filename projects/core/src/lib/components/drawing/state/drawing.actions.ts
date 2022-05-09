import { createAction, props } from '@ngrx/store';
import { DrawingFeatureModel } from '../models/drawing-feature.model';

const drawingActionsPrefix = '[Drawing]';

export const addFeature = createAction(
  `${drawingActionsPrefix} Add Feature`,
  props<{ feature: DrawingFeatureModel }>(),
);

export const removeAllFeatures = createAction(
  `${drawingActionsPrefix} Remove All Features`,
);
