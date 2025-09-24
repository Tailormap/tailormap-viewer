import  { FilterState, filterStateKey } from './filter.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CqlFilterHelper } from '../helpers/cql-filter.helper';
import { selectLayersWithServices, selectVisibleLayersWithServices } from '../../map/state/map.selectors';
import { ExtendedFilterGroupModel } from '../models/extended-filter-group.model';
import { TypesHelper } from '@tailormap-viewer/shared';
import { FilterTypeEnum } from '@tailormap-viewer/api';
import { BaseFilterModel } from '@tailormap-viewer/api';
import { FilterGroupModel } from '@tailormap-viewer/api';
import { FilterTypeHelper } from '../helpers/filter-type.helper';
import { SpatialFilterModel } from '@tailormap-viewer/api';

const selectFilterState = createFeatureSelector<FilterState>(filterStateKey);

export const selectAllFilterGroupsInConfig = createSelector(selectFilterState, state => state.configuredFilterGroups);

export const selectVerifiedCurrentFilterGroups = createSelector(selectFilterState, state => state.verifiedCurrentFilterGroups);

export const selectActiveFilterGroups = createSelector(
  selectVerifiedCurrentFilterGroups,
  selectVisibleLayersWithServices,
  (filterGroups, visibleLayers): FilterGroupModel[] => {
    const visibleLayerIds = visibleLayers.map(layer => layer.id);
    return filterGroups
      .filter(group => group.layerIds.some(layerId => visibleLayerIds.includes(layerId)))
      .map(group => ({
        ...group,
        layerIds: group.layerIds.filter(layerId => visibleLayerIds.includes(layerId)),
      }));
  },
);

export const selectFilterGroup = (source: string, layerId: string) => createSelector(
  selectActiveFilterGroups,
  groups => groups.find(group => group.source === source && group.layerIds.includes(layerId)),
);

export const selectFilterGroupForType = <T extends BaseFilterModel>(source: string, layerId: string, filterType: FilterTypeEnum) => createSelector(
  selectActiveFilterGroups,
  (groups): FilterGroupModel<T> | undefined => {
    const isOfType = (g: FilterGroupModel): g is FilterGroupModel<T> => g.type === filterType;
    const group = groups.find(g => g.source === source && g.layerIds.includes(layerId));
    return group && isOfType(group) ? group : undefined;
  },
);

export const selectFilterGroupsWithLayers = createSelector(
  selectActiveFilterGroups,
  selectLayersWithServices,
  (groups, layers): ExtendedFilterGroupModel[] => groups.map(group => ({
    ...group,
    layers: group.layerIds
      .map(layerId => layers.find(layer => layer.id === layerId))
      .filter(TypesHelper.isDefined),
  })),
);

export const selectEnabledFilterGroups = createSelector(
  selectActiveFilterGroups,
  groups => groups.filter(group => !group.disabled),
);

export const selectCQLFilters = createSelector(
  selectEnabledFilterGroups,
  (groups): Map<string, string> => CqlFilterHelper.getFilters(groups),
);

export const selectSpatialFilterGroupsWithReferenceLayers = createSelector(
  selectActiveFilterGroups,
  (groups): FilterGroupModel<SpatialFilterModel>[] => {
    return groups.filter(FilterTypeHelper.isSpatialFilterGroup)
      .filter(group => group.filters.length > 0 && group.filters[0].baseLayerId);
    },
);

export const selectFilteredLayerIds = createSelector(
  selectEnabledFilterGroups,
  (groups): string[] => groups.flatMap(group => group.layerIds),
);
