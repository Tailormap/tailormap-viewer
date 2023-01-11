import { TocState, tocStateKey } from './toc.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';

const selectTocState = createFeatureSelector<TocState>(tocStateKey);

export const selectFilterTerm = createSelector(selectTocState, state => state.filterTerm);

export const selectInfoTreeNodeId = createSelector(selectTocState, state => state.infoTreeNodeId);
