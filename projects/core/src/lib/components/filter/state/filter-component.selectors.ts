import { FilterComponentState, filterComponentStateKey } from './filter-component.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectFilterGroups } from '../../../filter/state/filter.selectors';
import { FilterTypeEnum } from '../../../filter/models/filter-type.enum';
import { FilterTypeHelper } from '../../../filter/helpers/filter-type.helper';

const selectFilterComponentState = createFeatureSelector<FilterComponentState>(filterComponentStateKey);
export const selectCreateFilterType = createSelector(selectFilterComponentState, state => state.createFilterType);
export const selectSelectedFilterGroupId = createSelector(selectFilterComponentState, state => state.selectedFilterGroup);

export const selectSelectedFilterGroup = createSelector(
  selectFilterGroups,
  selectSelectedFilterGroupId,
  (filterGroups, selectedFilterGroupId) => {
    return filterGroups.find(group => group.id === selectedFilterGroupId);
  },
);

export const selectSpatialFormVisible = createSelector(
  selectSelectedFilterGroup,
  selectCreateFilterType,
  (selectedFilterGroup, createFilterType) => {
    return createFilterType === FilterTypeEnum.SPATIAL || FilterTypeHelper.isSpatialFilterGroup(selectedFilterGroup);
  },
);
