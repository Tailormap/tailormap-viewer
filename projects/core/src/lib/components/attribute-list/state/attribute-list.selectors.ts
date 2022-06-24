import { AttributeListState, attributeListStateKey } from './attribute-list.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AttributeListRowModel } from '../models/attribute-list-row.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';

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

export const selectAttributeListTabData = (tabId: string) => createSelector(
  selectAttributeListData,
  data => data.filter(t => t.tabId === tabId),
);

export const selectSelectedTab = createSelector(
  selectAttributeListSelectedTab,
  selectAttributeListTabs,
  (selectedTab, tabs): AttributeListTabModel | null => {
    return tabs.find(t => t.id === selectedTab) || null;
  },
);

export const selectDataIdForSelectedTab = createSelector(
  selectSelectedTab,
  (selectedTab): string | null => {
    return selectedTab ? selectedTab.selectedDataId : null;
  },
);

export const selectDataForSelectedTab = createSelector(
  selectSelectedTab,
  selectAttributeListData,
  (selectedTab, data): AttributeListDataModel | null => {
    if (!selectedTab) {
      return null;
    }
    return data.find(d => d.id === selectedTab.selectedDataId) || null;
  },
);

export const selectLoadingDataSelectedTab = createSelector(
  selectSelectedTab,
  (tab): boolean => {
    return tab ? tab.loadingData : false;
  },
);

export const selectRowsForSelectedTab = createSelector(
  selectDataForSelectedTab,
  (data): AttributeListRowModel[] => {
    return data ? data.rows : [];
  },
);

export const selectColumnsForSelectedTab = createSelector(
  selectDataForSelectedTab,
  (data): AttributeListColumnModel[] => {
    return data ? data.columns : [];
  },
);

export const selectRowCountForSelectedTab = createSelector(
  selectRowsForSelectedTab,
  rows => rows.length,
);

export const selectSortForSelectedTab = createSelector(
  selectDataForSelectedTab,
  (data): { column: string; direction: string } | null => {
    return data && data.sortedColumn ? { column: data.sortedColumn, direction: data.sortDirection } : null;
  },
);

export const selectPagingDataSelectedTab = createSelector(
  selectDataForSelectedTab,
  (data: AttributeListDataModel | null): { id: string; totalCount: number | null; pageIndex: number; pageSize: number } => {
    if (!data) {
      return { id: '', totalCount: 0, pageIndex: 0, pageSize: 0 };
    }
    return { id: data.id, totalCount: data.totalCount, pageIndex: data.pageIndex, pageSize: data.pageSize };
  },
);
