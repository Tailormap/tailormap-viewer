import { DrawingState, drawingStateKey } from './drawing.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DrawingFeatureModel } from '../models/drawing-feature.model';

const selectDrawingState = createFeatureSelector<DrawingState>(drawingStateKey);

export const selectDrawingFeatures = createSelector(selectDrawingState, state => state.features);
export const selectSelectedDrawingFeatureId = createSelector(selectDrawingState, state => state.selectedFeature);
export const selectSelectedDrawingStyle = createSelector(selectDrawingState, state => state.selectedDrawingStyle);

export const selectHasDrawingFeatures = createSelector(
  selectDrawingFeatures, features => features.length > 0,
);

export const selectSelectedDrawingFeature = createSelector(
  selectDrawingFeatures,
  selectSelectedDrawingFeatureId,
  (features, selectedFeature): DrawingFeatureModel | null => {
    return features.find(feature => feature.__fid === selectedFeature) || null;
  });

export const selectDrawingFeaturesIncludingSelected = createSelector(
  selectDrawingFeatures,
  selectSelectedDrawingFeatureId,
  (features, selectedFeature): DrawingFeatureModel[] => {
    return features.map((feature, idx) => {
      return {
        ...feature,
        attributes: {
          ...feature.attributes,
          zIndex: idx + 1,
          selected: feature.__fid === selectedFeature,
        },
      };
    });
  });

