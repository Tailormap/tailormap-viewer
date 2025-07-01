import { FilterComponentState, filterComponentStateKey } from './filter-component.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectFilterGroups } from '../../../filter/state/filter.selectors';
import { FeatureModel, FilterTypeEnum, SpatialFilterGeometry } from '@tailormap-viewer/api';
import { FilterTypeHelper } from '../../../filter/helpers/filter-type.helper';
import { selectVisibleLayersWithAttributes } from '../../../map/state/map.selectors';

const selectFilterComponentState = createFeatureSelector<FilterComponentState>(filterComponentStateKey);
export const selectCreateFilterType = createSelector(selectFilterComponentState, state => state.createFilterType);
export const selectSelectedFilterGroupId = createSelector(selectFilterComponentState, state => state.selectedFilterGroup);
export const selectSelectedLayers = createSelector(selectFilterComponentState, state => state.selectedLayers || []);
export const selectSelectedSpatialFilterFeatureId = createSelector(selectFilterComponentState, state => state.selectedSpatialFilterFeatureId);
export const selectSelectedLayersCount = createSelector(selectSelectedLayers, selectedLayers => selectedLayers.length);
export const hasSelectedLayers = createSelector(selectSelectedLayersCount, selectedLayersCount => selectedLayersCount > 0);

export const selectSelectedFilterGroup = createSelector(
  selectFilterGroups,
  selectSelectedFilterGroupId,
  (filterGroups, selectedFilterGroupId) => {
    return filterGroups.find(group => group.id === selectedFilterGroupId);
  },
);

export const selectSelectedFilterGroupError = createSelector(
  selectSelectedFilterGroup,
  filterGroup => filterGroup?.error,
);

export const selectSpatialFormVisible = createSelector(
  selectSelectedFilterGroup,
  selectCreateFilterType,
  (selectedFilterGroup, createFilterType) => {
    return createFilterType === FilterTypeEnum.SPATIAL || FilterTypeHelper.isSpatialFilterGroup(selectedFilterGroup);
  },
);

export const selectBuffer = createSelector(
  selectSelectedFilterGroup,
  group => {
    if (!group || group.filters.length === 0 || !FilterTypeHelper.isSpatialFilterGroup(group)) {
      return undefined;
    }
    return group.filters[0].buffer;
  },
);

export const selectReferencableLayers = createSelector(
  selectSelectedLayers,
  selectVisibleLayersWithAttributes,
  (selectedLayers, availableLayers) => {
    return availableLayers.filter(layer => !selectedLayers.includes(layer.id));
  },
);

export const selectReferenceLayer = createSelector(
  selectSelectedFilterGroup,
  group => {
    if (!group || group.filters.length === 0 || !FilterTypeHelper.isSpatialFilterGroup(group)) {
      return undefined;
    }
    return group.filters[0].baseLayerId;
  },
);

export const selectGeometries = createSelector(
  selectSelectedFilterGroup,
  group => {
    if (!group || !FilterTypeHelper.isSpatialFilterGroup(group)) {
      return [];
    }
    return group.filters.reduce<SpatialFilterGeometry[]>((g, filter) => {
      return [ ...g, ...filter.geometries ];
    }, []);
  },
);

export const selectFilterFeatures = createSelector(
  selectGeometries,
  selectBuffer,
  (geometries, buffer) => {
    return geometries.map<FeatureModel>(geom => ({
      __fid: geom.id,
      geometry: geom.geometry,
      attributes: { buffer },
    }));
  });

export const selectSelectedFilterFeature = createSelector(
  selectFilterFeatures,
  selectSelectedSpatialFilterFeatureId,
  (geometries, selectedFeatureId) => {
    const features = geometries.filter(feature => feature.__fid === selectedFeatureId);
    if (features.length === 0) {
      return null;
    }
    return features[0];
  });

export const hasSelectedLayersAndGeometry = createSelector(
  selectSelectedLayers,
  selectGeometries,
  (selectedLayers, geometries) => {
    return selectedLayers.length > 0 && geometries.length > 0;
  },
);
