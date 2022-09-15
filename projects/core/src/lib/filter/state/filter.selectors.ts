import { FilterState, filterStateKey } from './filter.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CqlFilterHelper } from '../helpers/cql-filter.helper';

const selectFilterState = createFeatureSelector<FilterState>(filterStateKey);

export const selectFilterGroups = createSelector(selectFilterState, state => state.filterGroups);

export const selectFilterGroup = (source: string, layerId: number) => createSelector(
  selectFilterGroups,
  groups => groups.find(group => group.source === source && group.layerId === layerId),
);

export const selectCQLFilters = createSelector(
  selectFilterGroups,
  (groups): Map<number, string> => CqlFilterHelper.getFilters(groups),
);
