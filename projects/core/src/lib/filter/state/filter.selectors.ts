import  { FilterState, filterStateKey } from './filter.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CqlFilterHelper } from '../helpers/cql-filter.helper';
import { selectLayersWithServices } from '../../map/state/map.selectors';
import { ExtendedFilterGroupModel } from '../models/extended-filter-group.model';
import { TypesHelper } from '@tailormap-viewer/shared';
import { FilterTypeEnum } from '@tailormap-viewer/api';
import { BaseFilterModel } from '@tailormap-viewer/api';
import { FilterGroupModel } from '@tailormap-viewer/api';
import { FilterTypeHelper } from '../helpers/filter-type.helper';
import { SpatialFilterModel } from '@tailormap-viewer/api';

const selectFilterState = createFeatureSelector<FilterState>(filterStateKey);

export const selectAllFilterGroupsInConfig = createSelector(selectFilterState, state => state.allFilterGroupsInConfig);

export const selectFilterGroups = createSelector(selectFilterState, state => state.filterGroups);

export const selectFilterGroup = (source: string, layerId: string) => createSelector(
  selectFilterGroups,
  groups => groups.find(group => group.source === source && group.layerIds.includes(layerId)),
);

export const selectFilterGroupForType = <T extends BaseFilterModel>(source: string, layerId: string, filterType: FilterTypeEnum) => createSelector(
  selectFilterGroups,
  (groups): FilterGroupModel<T> | undefined => {
    const isOfType = (g: FilterGroupModel): g is FilterGroupModel<T> => g.type === filterType;
    const group = groups.find(g => g.source === source && g.layerIds.includes(layerId));
    return group && isOfType(group) ? group : undefined;
  },
);

export const selectFilterGroupsWithLayers = createSelector(
  selectFilterGroups,
  selectLayersWithServices,
  (groups, layers): ExtendedFilterGroupModel[] => groups.map(group => ({
    ...group,
    layers: group.layerIds
      .map(layerId => layers.find(layer => layer.id === layerId))
      .filter(TypesHelper.isDefined),
  })),
);

export const selectEnabledFilterGroups = createSelector(
  selectFilterGroups,
  groups => groups.filter(group => !group.disabled),
);

export const selectCQLFilters = createSelector(
  selectEnabledFilterGroups,
  (groups): Map<string, string> => CqlFilterHelper.getFilters(groups),
);

export const selectSpatialFilterGroupsWithReferenceLayers = createSelector(
  selectFilterGroups,
  (groups): FilterGroupModel<SpatialFilterModel>[] => {
    return groups.filter(FilterTypeHelper.isSpatialFilterGroup)
      .filter(group => group.filters.length > 0 && group.filters[0].baseLayerId);
    },
);

export const selectFilteredLayerIds = createSelector(
  selectEnabledFilterGroups,
  (groups): string[] => groups.flatMap(group => group.layerIds),
);
