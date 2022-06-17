import { AttributeListState, attributeListStateKey } from './attribute-list.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';

const selectAttributeListState = createFeatureSelector<AttributeListState>(attributeListStateKey);

export const selectAttributeListVisible = createSelector(selectAttributeListState, state => state.visible);
export const selectAttributeListTabs = createSelector(selectAttributeListState, state => state.tabs);
export const selectAttributeListData = createSelector(selectAttributeListState, state => state.data);
export const selectAttributeListHeight = createSelector(selectAttributeListState, state => state.height);
export const selectAttributeListSelectedTab = createSelector(selectAttributeListState, state => state.selectedTabId);

export const selectAttributeListTab = (tabId: string) => createSelector(
  selectAttributeListTabs,
  tabs => tabs.find(t => t.id === tabId),
);
