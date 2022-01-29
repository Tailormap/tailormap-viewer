import { FeatureInfoState, featureInfoStateKey } from './feature-info.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';

const selectFeatureInfoState = createFeatureSelector<FeatureInfoState>(featureInfoStateKey);

export const selectMapCoordinates = createSelector(selectFeatureInfoState, state => state.mapCoordinates);
export const selectMouseCoordinates = createSelector(selectFeatureInfoState, state => state.mouseCoordinates);
export const selectLoadingFeatureInfo = createSelector(selectFeatureInfoState, state => state.loadingData);
export const selectFeatureInfoDialogVisible = createSelector(selectFeatureInfoState, (state): boolean => state.dialogVisible);
export const selectFeatureInfoDialogCollapsed = createSelector(selectFeatureInfoState, (state): boolean => state.dialogCollapsed);
export const selectFeatureInfo = createSelector(selectFeatureInfoState, state => state.featureInfo);
export const selectFeatureInfoLoadingFailed = createSelector(selectFeatureInfoState, state => state.loadingDataFailed);
export const selectFeatureInfoErrorMessage = createSelector(selectFeatureInfoState, state => state.errorMessage);
