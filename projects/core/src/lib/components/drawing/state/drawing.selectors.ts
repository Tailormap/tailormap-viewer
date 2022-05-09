import { DrawingState, drawingStateKey } from './drawing.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';

const selectDrawingState = createFeatureSelector<DrawingState>(drawingStateKey);

export const selectFeatures = createSelector(selectDrawingState, state => state.features);
