import { EditState, editStateKey } from './edit.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';

const selectEditState = createFeatureSelector<EditState>(editStateKey);

export const selectEditActive = createSelector(selectEditState, state => state.isActive);
export const selectSelectedEditLayer = createSelector(selectEditState, state => state.selectedLayer);

export const selectEditActiveWithSelectedLayer = createSelector(
  selectEditActive,
  selectSelectedEditLayer,
  (isActive, selectedLayer) => {
    return isActive && !!selectedLayer;
  });
