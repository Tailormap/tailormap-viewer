import { createAction, props } from '@ngrx/store';
import { DrawingFeatureModel } from '../models/drawing-feature.model';

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
