import { FeatureInfoState, featureInfoStateKey } from './feature-info.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ArrayHelper, LoadingStateEnum } from '@tailormap-viewer/shared';
import { FeatureInfoModel } from '../models/feature-info.model';
import { FeatureInfoHelper } from '../helpers/feature-info.helper';
import { selectVisibleLayersWithServices } from '../../../map/state/map.selectors';
import { AttributeTypeHelper } from '@tailormap-viewer/api';

const selectFeatureInfoState = createFeatureSelector<FeatureInfoState>(featureInfoStateKey);

export const selectMapCoordinates = createSelector(selectFeatureInfoState, state => state.mapCoordinates);
export const selectMouseCoordinates = createSelector(selectFeatureInfoState, state => state.mouseCoordinates);
export const selectFeatureInfoDialogVisible = createSelector(selectFeatureInfoState, (state): boolean => state.dialogVisible);
export const selectFeatureInfoDialogCollapsed = createSelector(selectFeatureInfoState, (state): boolean => state.dialogCollapsed);

export const selectFeatureInfoFeatures = createSelector(selectFeatureInfoState, state => state.features);
export const selectFeatureInfoMetadata = createSelector(selectFeatureInfoState, state => state.columnMetadata);
export const selectFeatureInfoLayers = createSelector(selectFeatureInfoState, state => state.layers);

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
        if (AttributeTypeHelper.isGeometryType(attMetadata?.type)) {
          return;
        }
        attributes.push({ label: attMetadata?.alias || key, attributeValue: feature.attributes[key], key });
      });
      const attributeOrder = columnMetadata.map(c => c.key);
      featureInfoModels.push({
        __fid: feature.__fid,
        layer,
        sortedAttributes: attributes.sort(ArrayHelper.getArraySorter('key', attributeOrder)),
        geometry: FeatureInfoHelper.getGeometryForFeatureInfoFeature(feature, columnMetadata) || null,
      });
    });
    return featureInfoModels;
  },
);

export const selectLoadingFeatureInfo = createSelector(
  selectFeatureInfoLayers,
  layers => layers.some(l => l.loading === LoadingStateEnum.LOADING),
);

export const selectSelectedLayerId = createSelector(selectFeatureInfoState, state => state.selectedLayerId);

export const selectSelectedLayer = createSelector(
  selectFeatureInfoLayers,
  selectSelectedLayerId,
  (layers, selectedLayerId) => layers.find(l => l.id === selectedLayerId),
);

export const selectFeaturesForSelectedLayer = createSelector(
  selectFeatureInfoList,
  selectSelectedLayerId,
  (features, selectedLayerId) => features.filter(f => f.layer.id === selectedLayerId),
);

export const selectCurrentlySelectedFeature = createSelector(
  selectFeatureInfoList,
  selectSelectedLayer,
  (features, selectedLayer) => {
    if (!selectedLayer || !selectedLayer.selectedFeatureId) {
      return null;
    }
    return features.find(f => f.__fid === selectedLayer.selectedFeatureId) || null;
  },
);

export const selectCurrentlySelectedLayerError = createSelector(
  selectSelectedLayer,
  (selectedLayer) => {
    if (!selectedLayer) {
      return null;
    }
    return selectedLayer.error ?? null;
  },
);

const selectSelectedIndexAndTotal = createSelector(
    selectSelectedLayer,
    selectFeaturesForSelectedLayer,
    (layer, features) => {
        if (!layer) {
            return { idx: 0, total: 0 };
        }
        return { idx: features.findIndex(f => f.__fid === layer.selectedFeatureId ), total: features.length };
    },
);

export const selectIsPrevButtonDisabled = createSelector(
    selectSelectedIndexAndTotal,
    ({ idx, total }) => idx <= 0 || total <= 1,
);

export const selectIsNextButtonDisabled = createSelector(
    selectSelectedIndexAndTotal,
    ({ idx, total }) => idx >= total - 1 || total <= 1,
);

export const selectCurrentlySelectedFeatureGeometry = createSelector(
  selectFeatureInfoDialogVisible,
  selectCurrentlySelectedFeature,
  (dialogVisible, feature) => {
    if (!dialogVisible || !feature) {
      return null;
    }
    return feature.geometry;
  },
);
