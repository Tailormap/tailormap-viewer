import { AttributeListState, attributeListStateKey } from './attribute-list.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AttributeListRowModel } from '../models/attribute-list-row.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { AttributeListPagingDataType } from '../models/attribute-list-paging-data.type';

const selectAttributeListState = createFeatureSelector<AttributeListState>(attributeListStateKey);

export const selectAttributeListVisible = createSelector(selectAttributeListState, state => state.visible);
export const selectAttributeListPanelTitle = createSelector(selectAttributeListState, state => state.panelTitle);
export const selectAttributeListTabs = createSelector(selectAttributeListState, state => state.tabs);
export const selectAttributeListData = createSelector(selectAttributeListState, state => state.data);
export const selectAttributeListHeight = createSelector(selectAttributeListState, state => state.height);
export const selectAttributeListSelectedTab = createSelector(selectAttributeListState, state => state.selectedTabId);
export const selectCurrentlyHighlightedFeature = createSelector(selectAttributeListState, state => state.highlightedFeature);

export const selectAttributeListTab = (tabId: string) => createSelector(
  selectAttributeListTabs,
  tabs => tabs.find(t => t.id === tabId),
);

export const selectAttributeListTabData = (tabId: string) => createSelector(
  selectAttributeListData,
  data => data.filter(t => t.tabId === tabId),
);

export const selectAttributeListDataForId = (dataId: string) => createSelector(
  selectAttributeListData,
  data => data.find(t => t.id === dataId),
);

export const selectAttributeListTabForDataId = (dataId: string) => createSelector(
  selectAttributeListDataForId(dataId),
  selectAttributeListTabs,
  (data, tabs): AttributeListTabModel | null => {
    return data ? (tabs.find(t => t.id === data.tabId) || null) : null;
  },
);

export const selectAttributeListRow = (dataId: string, rowId: string) => createSelector(
  selectAttributeListDataForId(dataId),
  (data): AttributeListRowModel | null => {
    return data ? (data.rows.find(r => r.id === rowId) || null) : null;
  },
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
  (data: AttributeListDataModel | null): AttributeListPagingDataType => {
    if (!data) {
      return { id: '', totalCount: 0, pageIndex: 0, pageSize: 0 };
    }
    return { id: data.id, totalCount: data.totalCount, pageIndex: data.pageIndex, pageSize: data.pageSize };
  },
);

export const selectSelectedRowIdForSelectedTab = createSelector(
  selectDataForSelectedTab,
  (data): string | undefined => {
    return data?.selectedRowId || undefined;
  },
);

export const selectCurrentlySelectedFeatureGeometry = createSelector(
  selectAttributeListVisible,
  selectCurrentlyHighlightedFeature,
  (attributeListVisible, feature): string | null => {
    if (!attributeListVisible) {
      return null;
    }
    return feature?.geometry || null;
  },
);
