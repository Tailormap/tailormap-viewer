import { FilterComponentState, filterComponentStateKey } from './filter-component.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';

const selectFilterComponentState = createFeatureSelector<FilterComponentState>(filterComponentStateKey);

export const selectCreateFilterType = createSelector(selectFilterComponentState, state => state.createFilterType);
