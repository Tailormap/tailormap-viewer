import { DrawingState, drawingStateKey } from './drawing.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DrawingFeatureModel } from '../models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../../../map';

const selectDrawingState = createFeatureSelector<DrawingState>(drawingStateKey);

export const selectDrawingFeatures = createSelector(selectDrawingState, state => state.features);
export const selectSelectedDrawingFeatureId = createSelector(selectDrawingState, state => state.selectedFeature);
export const selectSelectedDrawingType = createSelector(selectDrawingState, state => state.selectedDrawingType);

export const selectHasDrawingFeatures = createSelector(
  selectDrawingFeatures, features => features.length > 0,
);

export const selectSelectedDrawingFeature = createSelector(
  selectDrawingFeatures,
  selectSelectedDrawingFeatureId,
  (features, selectedFeature): DrawingFeatureModel | null => {
    return features.find(feature => feature.__fid === selectedFeature) || null;
  });

export const selectDrawingFeaturesForMapRendering = createSelector(
  selectDrawingFeatures,
  selectSelectedDrawingFeatureId,
  (features, selectedFeature): DrawingFeatureModel[] => {
    // Marking a feature as selected shows a selection rectangle around the feature on the map.
    // We only do this for points/labels/images. For the other feature types (lines, polygons) the selection rectangle is added by the modify tool.
    const selectableFeatures = new Set([ DrawingFeatureTypeEnum.IMAGE, DrawingFeatureTypeEnum.POINT, DrawingFeatureTypeEnum.LABEL ]);
    return features
      .filter(feature => {
        return feature.__fid !== selectedFeature || (feature.__fid === selectedFeature && selectableFeatures.has(feature.attributes.type));
      })
      .map((feature, idx) => {
      const selected = feature.__fid === selectedFeature && selectableFeatures.has(feature.attributes.type);
      return {
        ...feature,
        attributes: {
          ...feature.attributes,
          zIndex: idx + 1,
          selected,
        },
      };
    });
  });
