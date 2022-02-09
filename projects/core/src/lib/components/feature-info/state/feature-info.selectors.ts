import { FeatureInfoState, featureInfoStateKey } from './feature-info.state';
import { createFeatureSelector, createSelector, select } from '@ngrx/store';
import { LoadStatusEnum } from '@tailormap-viewer/shared';
import { filter, pipe, take } from 'rxjs';
import { FeatureInfoHelper } from '../helpers/feature-info.helper';

const selectFeatureInfoState = createFeatureSelector<FeatureInfoState>(featureInfoStateKey);

export const selectMapCoordinates = createSelector(selectFeatureInfoState, state => state.mapCoordinates);
export const selectMouseCoordinates = createSelector(selectFeatureInfoState, state => state.mouseCoordinates);
export const selectFeatureInfoLoadStatus = createSelector(selectFeatureInfoState, state => state.loadStatus);
export const selectLoadingFeatureInfo = createSelector(selectFeatureInfoLoadStatus, loadStatus => loadStatus === LoadStatusEnum.LOADING);
export const selectFeatureInfoDialogVisible = createSelector(selectFeatureInfoState, (state): boolean => state.dialogVisible);
export const selectFeatureInfoDialogCollapsed = createSelector(selectFeatureInfoState, (state): boolean => state.dialogCollapsed);
export const selectFeatureInfo = createSelector(selectFeatureInfoState, state => state.featureInfo);
export const selectFeatureInfoErrorMessage = createSelector(selectFeatureInfoState, state => state.errorMessage);

export const selectTotalFeatureCount = createSelector(selectFeatureInfo, FeatureInfoHelper.getTotalFeatureInfoCount);

export const selectFeatureInfoError = createSelector(
  selectTotalFeatureCount,
  selectFeatureInfoLoadStatus,
  selectFeatureInfoErrorMessage,
  (featureInfoCount, loadStatus, errorMessage): { error: 'error' | 'no_records' | 'none'; errorMessage?: string } | null => {
    if (loadStatus === LoadStatusEnum.ERROR) {
      return { error: 'error', errorMessage };
    }
    if (loadStatus === LoadStatusEnum.LOADED && featureInfoCount === 0) {
      return { error: 'no_records'  };
    }
    if (loadStatus === LoadStatusEnum.LOADED) {
      return { error: 'none' };
    }
    return null;
  },
);

export const selectFeatureInfoError$ = pipe(
  select(selectFeatureInfoError),
  filter(error => error !== null),
  take(1),
);

