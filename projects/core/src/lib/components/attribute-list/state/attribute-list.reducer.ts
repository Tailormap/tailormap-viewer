import * as AttributeListActions from './attribute-list.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { AttributeListState, initialAttributeListState } from './attribute-list.state';
import { AttributeListStateHelper } from './attribute-list-state.helper';
import { StateHelper } from '@tailormap-viewer/shared';

const onSetAttributeListVisibility = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.setAttributeListVisibility>,
): AttributeListState => ({
  ...state,
  visible: typeof payload.visible === 'undefined' ? !state.visible : payload.visible,
});

const onUpdateAttributeListHeight = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.updateAttributeListHeight>,
): AttributeListState => ({
  ...state,
  height: payload.height,
});

const onChangeAttributeListTabs = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.changeAttributeListTabs>,
): AttributeListState => {
  const tabs = [...state.tabs].filter(t => payload.closedTabs.indexOf(t.id) === -1);
  const newTabs = payload.newTabs.filter(newTab => !tabs.some(t => t.layerId === newTab.layerId));
  const updatedTabs = tabs.concat(newTabs);
  const data = [...state.data].filter(d => payload.closedTabs.indexOf(d.tabId) === -1);
  const newData = payload.newData
    .filter(featureData => !data.some(f => f.id === featureData.id && f.tabId === featureData.tabId));
  let selectedTabId = state.selectedTabId;
  if (updatedTabs.findIndex(t => t.id === selectedTabId) === -1) {
    selectedTabId = updatedTabs.length > 0 ? updatedTabs[0].id : undefined;
  }
  return {
    ...state,
    tabs: updatedTabs,
    data: data.concat(newData),
    selectedTabId,
  };
};

const onSetSelectedTab = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.setSelectedTab>,
): AttributeListState => {
  const currentSelectedTab = state.selectedTabId;
  return {
    ...state,
    data: typeof currentSelectedTab === 'undefined'
      ? state.data
      : state.data.map(data => {
          return data.tabId === currentSelectedTab
            ? { ...data, rows: data.rows.map(row => ({ ...row, selected: false })) }
            : data;
      }),
    selectedTabId: payload.tabId,
  };
};

const onLoadData = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.loadData>,
): AttributeListState => ({
  ...state,
  tabs: AttributeListStateHelper.updateTab(
    state.tabs,
    payload.tabId,
    tab => ({ ...tab, loadingData: true }),
  ),
});

const onLoadDataSuccess = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.loadDataSuccess>,
): AttributeListState => {
  return {
    ...state,
    tabs: AttributeListStateHelper.updateTab(
      state.tabs,
      payload.tabId,
      tab => ({ ...tab, loadingData: false, initialDataLoaded: true }),
    ),
    data: AttributeListStateHelper.updateData(
      state.data,
      payload.data.id,
      data => ({
        ...data,
        errorMessage: payload.data.errorMessage,
        totalCount: payload.data.totalCount,
        rows: payload.data.rows,
        columns: data.columns.length > 0 ? data.columns : payload.data.columns,
      }),
    ),
  };
};

const onLoadDataFailed = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.loadDataFailed>,
): AttributeListState => {
  return {
    ...state,
    tabs: AttributeListStateHelper.updateTab(
      state.tabs,
      payload.tabId,
      tab => ({ ...tab, loadingData: false, loadingError: payload.data.errorMessage }),
    ),
    data: AttributeListStateHelper.updateData(
      state.data,
      payload.data.id,
      data => ({
        ...data,
        errorMessage: payload.data.errorMessage,
        totalCount: payload.data.totalCount,
        rows: payload.data.rows,
      }),
    ),
  };
};

const onUpdatePage = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.updatePage>,
): AttributeListState => {
  const data = state.data.find(d => d.id === payload.dataId);
  if (!data) {
    return state;
  }
  return {
    ...state,
    tabs: AttributeListStateHelper.updateTab(
      state.tabs,
      data.tabId,
      (tab => ({...tab, loadingData: true})),
    ),
    data: AttributeListStateHelper.updateData(
      state.data,
      payload.dataId,
      d => ({...d, pageIndex: payload.page}),
    ),
  };
};

const onUpdateSort = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.updateSort>,
): AttributeListState => {
  const data = state.data.find(d => d.id === payload.dataId);
  if (!data) {
    return state;
  }
  return {
    ...state,
    tabs: AttributeListStateHelper.updateTab(
      state.tabs,
      data.tabId,
      (tab => ({...tab, loadingData: true})),
    ),
    data: AttributeListStateHelper.updateData(
      state.data,
      payload.dataId,
      d => ({
        ...d,
        sortedColumn: payload.direction !== '' ? payload.column : '',
        sortDirection: payload.direction,
      }),
    ),
  };
};

const onUpdateRowSelected = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.updateRowSelected>,
): AttributeListState => {
  return {
    ...state,
    highlightedFeature: null,
    data: AttributeListStateHelper.updateData(
      state.data,
      payload.dataId,
      data => ({
        ...data,
        rows: data.rows.map(row => ({
          ...row,
          selected: row.id === payload.rowId ? payload.selected : false,
        })),
      }),
    ),
  };
};

const onSetHighlightedFeature = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.setHighlightedFeature>,
): AttributeListState => ({
    ...state,
    highlightedFeature: payload.feature,
});

const onChangeColumnPosition = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.changeColumnPosition>,
): AttributeListState => ({
  ...state,
  data: AttributeListStateHelper.updateData(
    state.data,
    payload.dataId,
    data => {
      const columnIdx = data.columns.findIndex(col => col.id === payload.columnId);
      const siblingIndex = payload.previousColumn === null ? 0 : data.columns.findIndex(col => col.id === payload.previousColumn);
      if (columnIdx === -1 || siblingIndex === -1) {
        return data;
      }
      const updatedColumns = [...data.columns];
      const newPosition = payload.previousColumn === null ? 0 : siblingIndex + 1;
      updatedColumns.splice(newPosition, 0, updatedColumns.splice(columnIdx, 1)[0]);
      return {
        ...data,
        columns: updatedColumns,
      };
    }),
});

const onToggleColumnVisible = (
  state: AttributeListState,
  payload: ReturnType<typeof AttributeListActions.toggleColumnVisible>,
): AttributeListState => ({
  ...state,
  data: AttributeListStateHelper.updateData(
    state.data,
    payload.dataId,
    data => ({
      ...data,
      columns: StateHelper.updateArrayItemInState(
        data.columns,
        c => c.id === payload.columnId,
        c => ({ ...c, visible: !c.visible }),
      ),
    }),
  ),
});

const attributeListReducerImpl = createReducer<AttributeListState>(
  initialAttributeListState,
  on(AttributeListActions.setAttributeListVisibility, onSetAttributeListVisibility),
  on(AttributeListActions.updateAttributeListHeight, onUpdateAttributeListHeight),
  on(AttributeListActions.changeAttributeListTabs, onChangeAttributeListTabs),
  on(AttributeListActions.setSelectedTab, onSetSelectedTab),
  on(AttributeListActions.loadData, onLoadData),
  on(AttributeListActions.loadDataSuccess, onLoadDataSuccess),
  on(AttributeListActions.loadDataFailed, onLoadDataFailed),
  on(AttributeListActions.updatePage, onUpdatePage),
  on(AttributeListActions.updateSort, onUpdateSort),
  on(AttributeListActions.updateRowSelected, onUpdateRowSelected),
  on(AttributeListActions.changeColumnPosition, onChangeColumnPosition),
  on(AttributeListActions.toggleColumnVisible, onToggleColumnVisible),
  on(AttributeListActions.setHighlightedFeature, onSetHighlightedFeature),
);
export const attributeListReducer = (state: AttributeListState | undefined, action: Action) => attributeListReducerImpl(state, action);
