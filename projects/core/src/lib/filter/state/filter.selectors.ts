import  { FilterState, filterStateKey } from './filter.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CqlFilterHelper } from '../helpers/cql-filter.helper';
import { selectLayersWithServices } from '../../map/state/map.selectors';
import { ExtendedFilterGroupModel } from '../models/extended-filter-group.model';
import { TypesHelper } from '@tailormap-viewer/shared';
import { FilterTypeEnum } from '../models/filter-type.enum';
import { BaseFilterModel } from '../models/base-filter.model';
import { FilterGroupModel } from '../models/filter-group.model';
import { FilterTypeHelper } from '../helpers/filter-type.helper';
import { SpatialFilterModel } from '../models/spatial-filter.model';

const selectFilterState = createFeatureSelector<FilterState>(filterStateKey);

export const selectFilterGroups = createSelector(selectFilterState, state => state.filterGroups);

export const selectFilterGroup = (source: string, layerName: string) => createSelector(
  selectFilterGroups,
  groups => groups.find(group => group.source === source && group.layerNames.includes(layerName)),
);

export const selectFilterGroupForType = <T extends BaseFilterModel>(source: string, layerName: string, filterType: FilterTypeEnum) => createSelector(
  selectFilterGroups,
  (groups): FilterGroupModel<T> | undefined => {
    const isOfType = (g: FilterGroupModel): g is FilterGroupModel<T> => g.type === filterType;
    const group = groups.find(g => g.source === source && g.layerNames.includes(layerName));
    return group && isOfType(group) ? group : undefined;
  },
);

export const selectFilterGroupsWithLayers = createSelector(
  selectFilterGroups,
  selectLayersWithServices,
  (groups, layers): ExtendedFilterGroupModel[] => groups.map(group => ({
    ...group,
    layers: group.layerNames
      .map(layerName => layers.find(layer => layer.name === layerName))
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
      .filter(group => group.filters.length > 0 && group.filters[0].baseLayerName);
    },
);
