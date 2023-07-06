import { EditState, editStateKey } from './edit.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FeatureInfoFeatureModel } from '../../feature-info/models/feature-info-feature.model';
import { FeatureInfoColumnMetadataModel } from '../../feature-info/models/feature-info-column-metadata.model';
import { FeatureWithMetadataModel } from '../models/feature-with-metadata.model';

const selectEditState = createFeatureSelector<EditState>(editStateKey);

export const selectEditActive = createSelector(selectEditState, state => state.isActive);
export const selectSelectedEditLayer = createSelector(selectEditState, state => state.selectedLayer);
export const selectEditMapCoordinates = createSelector(selectEditState, state => state.mapCoordinates);
export const selectEditLoadStatus = createSelector(selectEditState, state => state.loadStatus);
export const selectLoadingEditFeatures = createSelector(selectEditLoadStatus, loadStatus => loadStatus === LoadingStateEnum.LOADING);
export const selectEditDialogVisible = createSelector(selectEditState, (state): boolean => state.dialogVisible);
export const selectEditDialogCollapsed = createSelector(selectEditState, (state): boolean => state.dialogCollapsed);
export const selectEditFeatures = createSelector(selectEditState, (state): FeatureInfoFeatureModel[] => state.features);
export const selectEditFeatureColumnMetadata = createSelector(selectEditState, (state): FeatureInfoColumnMetadataModel[] => state.columnMetadata);
export const selectSelectedEditFeatureId = createSelector(selectEditState, (state): string | null => state.selectedFeature);

export const selectEditActiveWithSelectedLayer = createSelector(
  selectEditActive,
  selectSelectedEditLayer,
  (isActive, selectedLayer) => {
    return isActive && !!selectedLayer;
  });

export const selectSelectedEditFeature = createSelector(
  selectEditFeatures,
  selectEditFeatureColumnMetadata,
  selectSelectedEditFeatureId,
  (features, columnMetadata, selectedFeatureId): FeatureWithMetadataModel | null => {
    if (selectedFeatureId === null || features.length === 0) {
      return null;
    }
    const feature = features.find(f => f.__fid === selectedFeatureId) || null;
    if (!feature) {
      return null;
    }
    return {
      feature,
      columnMetadata: columnMetadata.filter(column => column.layerId === feature?.layerId),
    };
  });
