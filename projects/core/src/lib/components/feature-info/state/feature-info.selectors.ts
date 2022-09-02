import { FeatureInfoState, featureInfoStateKey } from './feature-info.state';
import { createFeatureSelector, createSelector, select } from '@ngrx/store';
import { ArrayHelper, LoadingStateEnum } from '@tailormap-viewer/shared';
import { filter, pipe, take } from 'rxjs';
import { FeatureInfoModel } from '../models/feature-info.model';
import { FeatureInfoHelper } from '../helpers/feature-info.helper';
import { selectVisibleLayersWithServices } from '../../../map/state/map.selectors';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';

const selectFeatureInfoState = createFeatureSelector<FeatureInfoState>(featureInfoStateKey);

export const selectMapCoordinates = createSelector(selectFeatureInfoState, state => state.mapCoordinates);
export const selectMouseCoordinates = createSelector(selectFeatureInfoState, state => state.mouseCoordinates);
export const selectFeatureInfoLoadStatus = createSelector(selectFeatureInfoState, state => state.loadStatus);
export const selectLoadingFeatureInfo = createSelector(selectFeatureInfoLoadStatus, loadStatus => loadStatus === LoadingStateEnum.LOADING);
export const selectFeatureInfoDialogVisible = createSelector(selectFeatureInfoState, (state): boolean => state.dialogVisible);
export const selectFeatureInfoDialogCollapsed = createSelector(selectFeatureInfoState, (state): boolean => state.dialogCollapsed);
export const selectFeatureInfoErrorMessage = createSelector(selectFeatureInfoState, state => state.errorMessage);

export const selectFeatureInfoFeatures = createSelector(selectFeatureInfoState, state => state.features);
export const selectFeatureInfoMetadata = createSelector(selectFeatureInfoState, state => state.columnMetadata);
export const selectFeatureInfoList = createSelector(
  selectFeatureInfoFeatures,
  selectFeatureInfoMetadata,
  selectVisibleLayersWithServices,
  (features, metadata, layers): FeatureInfoModel[] => {
    const featureInfoModels: FeatureInfoModel[] = [];
    features.forEach(feature => {
      const layer = layers.find(l => l.id === feature.layerId);
      if (!layer) {
        return;
      }
      const columnMetadata = metadata.filter(m => m.layerId === feature.layerId);
      const columnMetadataDict = new Map((columnMetadata || []).map(c => [ c.key, c ]));
      const attributes: Array<{ label: string; attributeValue: any; key: string }> = [];
      Object.keys(feature.attributes).forEach(key => {
        const attMetadata = columnMetadataDict.get(key);
        if (attMetadata?.type === FeatureAttributeTypeEnum.GEOMETRY) {
          return;
        }
        attributes.push({ label: attMetadata?.alias || key, attributeValue: feature.attributes[key], key });
      });
      const attributeOrder = columnMetadata.map(c => c.key);
      featureInfoModels.push({
        feature,
        columnMetadata,
        layer,
        sortedAttributes: attributes.sort(ArrayHelper.getArraySorter('key', attributeOrder)),
      });
    });
    return featureInfoModels;
  },
);
export const selectCurrentFeatureIndex = createSelector(selectFeatureInfoState, state => state.currentFeatureIndex);
export const selectTotalFeatureCount = createSelector(selectFeatureInfoList, features => features.length);
export const selectFeatureInfoCounts = createSelector(
  selectCurrentFeatureIndex,
  selectTotalFeatureCount,
  (current, total) => ({ current, total }),
);
export const selectCurrentlySelectedFeature = createSelector(
  selectFeatureInfoList,
  selectCurrentFeatureIndex,
  (features, idx) => {
    if (idx === features.length) {
      return features[features.length - 1];
    }
    return features[idx];
  },
);
export const selectCurrentlySelectedFeatureGeometry = createSelector(
  selectFeatureInfoDialogVisible,
  selectCurrentlySelectedFeature,
  (dialogVisible, feature) => {
    if (!dialogVisible) {
      return null;
    }
    return FeatureInfoHelper.getGeometryForFeatureInfoFeature(feature);
  },
);

export const selectFeatureInfoError = createSelector(
  selectTotalFeatureCount,
  selectFeatureInfoLoadStatus,
  selectFeatureInfoErrorMessage,
  (featureInfoCount, loadStatus, errorMessage): { error: 'error' | 'no_records' | 'none'; errorMessage?: string } | null => {
    if (loadStatus === LoadingStateEnum.FAILED) {
      return { error: 'error', errorMessage };
    }
    if (loadStatus === LoadingStateEnum.LOADED && featureInfoCount === 0) {
      return { error: 'no_records'  };
    }
    if (loadStatus === LoadingStateEnum.LOADED) {
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

