import { DrawingState, drawingStateKey } from './drawing.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DrawingFeatureModel } from '../models/drawing-feature.model';

const selectDrawingState = createFeatureSelector<DrawingState>(drawingStateKey);

export const selectFeatures = createSelector(selectDrawingState, state => state.features);
export const selectSelectedFeature = createSelector(selectDrawingState, state => state.selectedFeature);
export const selectFeaturesIncludingSelected = createSelector(selectFeatures, selectSelectedFeature, (features, selectedFeature): DrawingFeatureModel[] => {
  return features.map(feature => {
    return {
      ...feature,
      attributes: {
        ...feature.attributes,
        selected: feature.__fid === selectedFeature,
      },
    };
  });
});

