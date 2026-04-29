import * as AttributeListActions from './attribute-list.actions';
import { attributeListReducer } from './attribute-list.reducer';
import { AttributeListState, initialAttributeListState } from './attribute-list.state';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';
import { AttributeType } from '@tailormap-viewer/api';
import { AttributeListRowModel } from '../models/attribute-list-row.model';

const createTab = (overrides: Partial<AttributeListTabModel> = {}): AttributeListTabModel => ({
  id: 'tab-1',
  label: 'Tab 1',
  tabSourceId: 'source-1',
  layerId: 'layer-1',
  selectedDataId: 'data-1',
  initialDataId: 'data-1',
  initialDataLoaded: false,
  loadingData: false,
  ...overrides,
});

const createColumn = (overrides: Partial<AttributeListColumnModel> = {}): AttributeListColumnModel => ({
  id: 'col-1',
  label: 'Column 1',
  type: AttributeType.STRING,
  visible: true,
  ...overrides,
});

const createData = (overrides: Partial<AttributeListDataModel> = {}): AttributeListDataModel => ({
  id: 'data-1',
  tabId: 'tab-1',
  columns: [],
  rows: [],
  pageSize: 10,
  pageIndex: 0,
  totalCount: null,
  sortDirection: '',
  ...overrides,
});

const createState = (overrides: Partial<AttributeListState> = {}): AttributeListState => ({
  ...initialAttributeListState,
  ...overrides,
});

describe('AttributeListReducer', () => {

  test('returns initial state for unknown action', () => {
    const state = attributeListReducer(undefined, { type: '@@UNKNOWN' } as any);
    expect(state).toEqual(initialAttributeListState);
  });

  describe('setAttributeListVisibility', () => {
    test('toggles visibility when visible is undefined', () => {
      const state = createState({ visible: false });
      const result = attributeListReducer(state, AttributeListActions.setAttributeListVisibility({}));
      expect(result.visible).toBe(true);
    });

    test('sets visibility to explicit value', () => {
      const state = createState({ visible: true });
      const result = attributeListReducer(state, AttributeListActions.setAttributeListVisibility({ visible: false }));
      expect(result.visible).toBe(false);
    });

    test('clears highlightedFeature', () => {
      const state = createState({ highlightedFeature: { tabId: 'tab-1' } as any });
      const result = attributeListReducer(state, AttributeListActions.setAttributeListVisibility({ visible: true }));
      expect(result.highlightedFeature).toBeUndefined();
    });

    test('clears selectedRowId on all data entries', () => {
      const state = createState({
        data: [
          createData({ id: 'data-1', selectedRowId: 'row-1' }),
          createData({ id: 'data-2', tabId: 'tab-2', selectedRowId: 'row-2' }),
        ],
      });
      const result = attributeListReducer(state, AttributeListActions.setAttributeListVisibility({ visible: true }));
      expect(result.data.every(d => d.selectedRowId === undefined)).toBe(true);
    });
  });

  describe('changeAttributeListTabs', () => {
    test('adds new tabs and data', () => {
      const state = createState();
      const newTab = createTab();
      const newData = createData();
      const result = attributeListReducer(state, AttributeListActions.changeAttributeListTabs({
        newTabs: [newTab],
        newData: [newData],
        closedTabs: [],
      }));
      expect(result.tabs).toEqual([newTab]);
      expect(result.data).toEqual([newData]);
    });

    test('adds new tabs and data with initial sort', () => {
      const state = createState({
        initialDataSort: [{
          layerId: 'layer-1',
          tabSourceId: 'source-1',
          sortedColumn: 'col-1',
          sortDirection: 'asc',
          source: 'config' }],
      });
      const newTab = createTab();
      const newData = createData();
      const result = attributeListReducer(state, AttributeListActions.changeAttributeListTabs({
        newTabs: [newTab],
        newData: [newData],
        closedTabs: [],
      }));

      expect(result.tabs).toEqual([newTab]);
      expect(result.data).toEqual([{ ...newData, sortedColumn: 'col-1', sortDirection: 'asc' }]);
    });

    test('adds new tabs and data with initial sort where bookmark sort takes precedence over configured sort', () => {
      const state = createState({
        initialDataSort: [{
          layerId: 'layer-1',
          tabSourceId: 'source-1',
          sortedColumn: 'col-1',
          sortDirection: 'asc',
          source: 'config',
        }, {
          layerId: 'layer-1',
          tabSourceId: 'source-1',
          sortedColumn: 'col-1',
          sortDirection: 'desc',
          source: 'bookmark',
        }],
      });
      const newTab = createTab();
      const newData = createData();
      const result = attributeListReducer(state, AttributeListActions.changeAttributeListTabs({
        newTabs: [newTab],
        newData: [newData],
        closedTabs: [],
      }));

      expect(result.tabs).toEqual([newTab]);
      expect(result.data).toEqual([{ ...newData, sortedColumn: 'col-1', sortDirection: 'desc' }]);
    });

    test('closes tabs and their data', () => {
      const state = createState({
        tabs: [ createTab({ id: 'tab-1' }), createTab({ id: 'tab-2' }) ],
        data: [ createData({ tabId: 'tab-1' }), createData({ id: 'data-2', tabId: 'tab-2' }) ],
        selectedTabId: 'tab-2',
      });
      const result = attributeListReducer(state, AttributeListActions.changeAttributeListTabs({
        newTabs: [],
        newData: [],
        closedTabs: ['tab-2'],
      }));
      expect(result.tabs).toHaveLength(1);
      expect(result.tabs[0].id).toBe('tab-1');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].tabId).toBe('tab-1');
    });

    test('updates selectedTabId when selected tab is closed', () => {
      const state = createState({
        tabs: [ createTab({ id: 'tab-1' }), createTab({ id: 'tab-2' }) ],
        data: [],
        selectedTabId: 'tab-2',
      });
      const result = attributeListReducer(state, AttributeListActions.changeAttributeListTabs({
        newTabs: [],
        newData: [],
        closedTabs: ['tab-2'],
      }));
      expect(result.selectedTabId).toBe('tab-1');
    });

    test('sets selectedTabId to undefined when all tabs are closed', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1' })],
        data: [],
        selectedTabId: 'tab-1',
      });
      const result = attributeListReducer(state, AttributeListActions.changeAttributeListTabs({
        newTabs: [],
        newData: [],
        closedTabs: ['tab-1'],
      }));
      expect(result.selectedTabId).toBeUndefined();
    });

    test('does not add duplicate tabs or data', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1', layerId: 'layer-1' })],
        data: [createData({ id: 'data-1', tabId: 'tab-1' })],
      });
      const result = attributeListReducer(state, AttributeListActions.changeAttributeListTabs({
        newTabs: [createTab({ id: 'tab-2', layerId: 'layer-1' })],
        newData: [createData({ id: 'data-1', tabId: 'tab-1' })],
        closedTabs: [],
      }));
      expect(result.tabs).toHaveLength(1);
      expect(result.data).toHaveLength(1);
    });

    test('clears highlightedFeature when its tab is closed', () => {
      const state = createState({
        tabs: [ createTab({ id: 'tab-1' }), createTab({ id: 'tab-2' }) ],
        data: [],
        highlightedFeature: { tabId: 'tab-2' } as any,
      });
      const result = attributeListReducer(state, AttributeListActions.changeAttributeListTabs({
        newTabs: [],
        newData: [],
        closedTabs: ['tab-2'],
      }));
      expect(result.highlightedFeature).toBeUndefined();
    });

    test('keeps highlightedFeature when its tab is not closed', () => {
      const highlighted = { tabId: 'tab-1' } as any;
      const state = createState({
        tabs: [ createTab({ id: 'tab-1' }), createTab({ id: 'tab-2' }) ],
        data: [],
        highlightedFeature: highlighted,
      });
      const result = attributeListReducer(state, AttributeListActions.changeAttributeListTabs({
        newTabs: [],
        newData: [],
        closedTabs: ['tab-2'],
      }));
      expect(result.highlightedFeature).toBe(highlighted);
    });
  });

  describe('setSelectedTab', () => {
    test('sets selectedTabId', () => {
      const state = createState({ selectedTabId: 'tab-1' });
      const result = attributeListReducer(state, AttributeListActions.setSelectedTab({ tabId: 'tab-2' }));
      expect(result.selectedTabId).toBe('tab-2');
    });

    test('clears selectedRowId for previous tab data', () => {
      const state = createState({
        selectedTabId: 'tab-1',
        data: [
          createData({ id: 'data-1', tabId: 'tab-1', selectedRowId: 'row-1' }),
          createData({ id: 'data-2', tabId: 'tab-2', selectedRowId: 'row-2' }),
        ],
      });
      const result = attributeListReducer(state, AttributeListActions.setSelectedTab({ tabId: 'tab-2' }));
      expect(result.data.find(d => d.id === 'data-1')?.selectedRowId).toBeUndefined();
      expect(result.data.find(d => d.id === 'data-2')?.selectedRowId).toBe('row-2');
    });

    test('clears highlightedFeature when switching tabs', () => {
      const state = createState({
        selectedTabId: 'tab-1',
        highlightedFeature: { tabId: 'tab-1' } as any,
      });
      const result = attributeListReducer(state, AttributeListActions.setSelectedTab({ tabId: 'tab-2' }));
      expect(result.highlightedFeature).toBeUndefined();
    });

    test('keeps highlightedFeature when re-selecting same tab', () => {
      const highlighted = { tabId: 'tab-1' } as any;
      const state = createState({
        selectedTabId: 'tab-1',
        highlightedFeature: highlighted,
      });
      const result = attributeListReducer(state, AttributeListActions.setSelectedTab({ tabId: 'tab-1' }));
      expect(result.highlightedFeature).toBe(highlighted);
    });
  });

  describe('loadData', () => {
    test('sets loadingData to true for the tab', () => {
      const state = createState({ tabs: [createTab({ id: 'tab-1', loadingData: false })] });
      const result = attributeListReducer(state, AttributeListActions.loadData({ tabId: 'tab-1' }));
      expect(result.tabs[0].loadingData).toBe(true);
    });

    test('clears loadingError for the tab', () => {
      const state = createState({ tabs: [createTab({ id: 'tab-1', loadingError: 'previous error' })] });
      const result = attributeListReducer(state, AttributeListActions.loadData({ tabId: 'tab-1' }));
      expect(result.tabs[0].loadingError).toBeUndefined();
    });
  });

  describe('loadDataSuccess', () => {
    test('sets loadingData to false and initialDataLoaded to true', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1', loadingData: true, initialDataLoaded: false })],
        data: [createData({ id: 'data-1', tabId: 'tab-1' })],
      });
      const result = attributeListReducer(state, AttributeListActions.loadDataSuccess({
        tabId: 'tab-1',
        data: { id: 'data-1', success: true, totalCount: 5, columns: [], rows: [], pageSize: 10 },
      }));
      expect(result.tabs[0].loadingData).toBe(false);
      expect(result.tabs[0].initialDataLoaded).toBe(true);
    });

    test('updates data rows and totalCount', () => {
      const rows = [{ id: 'r1', attributes: {} }] as AttributeListRowModel[];
      const state = createState({
        tabs: [createTab({ id: 'tab-1' })],
        data: [createData({ id: 'data-1', tabId: 'tab-1', rows: [] })],
      });
      const result = attributeListReducer(state, AttributeListActions.loadDataSuccess({
        tabId: 'tab-1',
        data: { id: 'data-1', success: true, totalCount: 1, columns: [], rows, pageSize: 10 },
      }));
      expect(result.data[0].rows).toEqual(rows);
      expect(result.data[0].totalCount).toBe(1);
    });

    test('uses loaded columns only when data has no existing columns', () => {
      const existingColumns = [createColumn({ id: 'col-existing' })];
      const loadedColumns = [createColumn({ id: 'col-loaded' })];
      const state = createState({
        tabs: [createTab({ id: 'tab-1' })],
        data: [createData({ id: 'data-1', tabId: 'tab-1', columns: existingColumns })],
      });
      const result = attributeListReducer(state, AttributeListActions.loadDataSuccess({
        tabId: 'tab-1',
        data: { id: 'data-1', success: true, totalCount: 0, columns: loadedColumns, rows: [], pageSize: 10 },
      }));
      expect(result.data[0].columns).toEqual(existingColumns);
    });

    test('sets loaded columns when data has no existing columns', () => {
      const loadedColumns = [createColumn({ id: 'col-loaded' })];
      const state = createState({
        tabs: [createTab({ id: 'tab-1' })],
        data: [createData({ id: 'data-1', tabId: 'tab-1', columns: [] })],
      });
      const result = attributeListReducer(state, AttributeListActions.loadDataSuccess({
        tabId: 'tab-1',
        data: { id: 'data-1', success: true, totalCount: 0, columns: loadedColumns, rows: [], pageSize: 10 },
      }));
      expect(result.data[0].columns).toEqual(loadedColumns);
    });

    test('clears selectedRowId', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1' })],
        data: [createData({ id: 'data-1', tabId: 'tab-1', selectedRowId: 'row-1' })],
      });
      const result = attributeListReducer(state, AttributeListActions.loadDataSuccess({
        tabId: 'tab-1',
        data: { id: 'data-1', success: true, totalCount: 0, columns: [], rows: [], pageSize: 10 },
      }));
      expect(result.data[0].selectedRowId).toBeUndefined();
    });

    test('updates pageIndex when provided', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1' })],
        data: [createData({ id: 'data-1', tabId: 'tab-1', pageIndex: 2 })],
      });
      const result = attributeListReducer(state, AttributeListActions.loadDataSuccess({
        tabId: 'tab-1',
        data: { id: 'data-1', success: true, totalCount: 0, columns: [], rows: [], pageSize: 10, pageIndex: 0 },
      }));
      expect(result.data[0].pageIndex).toBe(0);
    });

    test('keeps existing pageIndex when not provided', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1' })],
        data: [createData({ id: 'data-1', tabId: 'tab-1', pageIndex: 2 })],
      });
      const result = attributeListReducer(state, AttributeListActions.loadDataSuccess({
        tabId: 'tab-1',
        data: { id: 'data-1', success: true, totalCount: 0, columns: [], rows: [], pageSize: 10 },
      }));
      expect(result.data[0].pageIndex).toBe(2);
    });
  });

  describe('loadDataFailed', () => {
    test('sets loadingData to false and stores error', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1', loadingData: true })],
        data: [createData({ id: 'data-1', tabId: 'tab-1' })],
      });
      const result = attributeListReducer(state, AttributeListActions.loadDataFailed({
        tabId: 'tab-1',
        data: { id: 'data-1', success: false, errorMessage: 'load failed', totalCount: null, columns: [], rows: [], pageSize: 10 },
      }));
      expect(result.tabs[0].loadingData).toBe(false);
      expect(result.tabs[0].loadingError).toBe('load failed');
    });

    test('updates data errorMessage', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1' })],
        data: [createData({ id: 'data-1', tabId: 'tab-1' })],
      });
      const result = attributeListReducer(state, AttributeListActions.loadDataFailed({
        tabId: 'tab-1',
        data: { id: 'data-1', success: false, errorMessage: 'error!', totalCount: null, columns: [], rows: [], pageSize: 10 },
      }));
      expect(result.data[0].errorMessage).toBe('error!');
    });
  });

  describe('updatePage', () => {
    test('updates pageIndex and sets loadingData on tab', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1', loadingData: false })],
        data: [createData({ id: 'data-1', tabId: 'tab-1', pageIndex: 0 })],
      });
      const result = attributeListReducer(state, AttributeListActions.updatePage({ dataId: 'data-1', page: 3 }));
      expect(result.data[0].pageIndex).toBe(3);
      expect(result.tabs[0].loadingData).toBe(true);
    });

    test('returns unchanged state when dataId not found', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1' })],
        data: [createData({ id: 'data-1', tabId: 'tab-1' })],
      });
      const result = attributeListReducer(state, AttributeListActions.updatePage({ dataId: 'nonexistent', page: 3 }));
      expect(result).toBe(state);
    });
  });

  describe('updateSort', () => {
    test('sets sorted column and direction', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1' })],
        data: [createData({ id: 'data-1', tabId: 'tab-1' })],
      });
      const result = attributeListReducer(state, AttributeListActions.updateSort({ dataId: 'data-1', column: 'name', direction: 'asc' }));
      expect(result.data[0].sortedColumn).toBe('name');
      expect(result.data[0].sortDirection).toBe('asc');
      expect(result.tabs[0].loadingData).toBe(true);
    });

    test('clears sortedColumn when direction is empty string', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1' })],
        data: [createData({ id: 'data-1', tabId: 'tab-1', sortedColumn: 'name', sortDirection: 'asc' })],
      });
      const result = attributeListReducer(state, AttributeListActions.updateSort({ dataId: 'data-1', column: 'name', direction: '' }));
      expect(result.data[0].sortedColumn).toBe('');
      expect(result.data[0].sortDirection).toBe('');
    });

    test('returns unchanged state when dataId not found', () => {
      const state = createState({
        data: [createData({ id: 'data-1', tabId: 'tab-1' })],
      });
      const result = attributeListReducer(state, AttributeListActions.updateSort({ dataId: 'nonexistent', column: 'name', direction: 'asc' }));
      expect(result).toBe(state);
    });
  });

  describe('updateRowSelected', () => {
    test('selects a row', () => {
      const state = createState({
        data: [createData({ id: 'data-1', tabId: 'tab-1', selectedRowId: undefined })],
      });
      const result = attributeListReducer(state, AttributeListActions.updateRowSelected({ dataId: 'data-1', rowId: 'row-1', selected: true }));
      expect(result.data[0].selectedRowId).toBe('row-1');
    });

    test('deselects a row when same rowId is selected again', () => {
      const state = createState({
        data: [createData({ id: 'data-1', tabId: 'tab-1', selectedRowId: 'row-1' })],
      });
      const result = attributeListReducer(state, AttributeListActions.updateRowSelected({ dataId: 'data-1', rowId: 'row-1', selected: false }));
      expect(result.data[0].selectedRowId).toBeUndefined();
    });

    test('sets highlightedFeature to null', () => {
      const state = createState({
        data: [createData({ id: 'data-1', tabId: 'tab-1' })],
        highlightedFeature: { tabId: 'tab-1' } as any,
      });
      const result = attributeListReducer(state, AttributeListActions.updateRowSelected({ dataId: 'data-1', rowId: 'row-1', selected: true }));
      expect(result.highlightedFeature).toBeNull();
    });
  });

  describe('setHighlightedFeature', () => {
    test('sets highlightedFeature', () => {
      const state = createState();
      const feature = { tabId: 'tab-1', __fid: 'f1' } as any;
      const result = attributeListReducer(state, AttributeListActions.setHighlightedFeature({ feature }));
      expect(result.highlightedFeature).toBe(feature);
    });

    test('clears highlightedFeature when null', () => {
      const state = createState({ highlightedFeature: { tabId: 'tab-1' } as any });
      const result = attributeListReducer(state, AttributeListActions.setHighlightedFeature({ feature: null }));
      expect(result.highlightedFeature).toBeNull();
    });
  });

  describe('changeColumnPosition', () => {
    test('moves column to first position when previousColumn is null', () => {
      const state = createState({
        data: [createData({
          id: 'data-1',
          columns: [
            createColumn({ id: 'col-A' }),
            createColumn({ id: 'col-B' }),
            createColumn({ id: 'col-C' }),
          ],
        })],
      });
      const result = attributeListReducer(state, AttributeListActions.changeColumnPosition({
        dataId: 'data-1', columnId: 'col-C', previousColumn: null,
      }));
      expect(result.data[0].columns.map(c => c.id)).toEqual([ 'col-C', 'col-A', 'col-B' ]);
    });

    test('moves column after a sibling', () => {
      const state = createState({
        data: [createData({
          id: 'data-1',
          columns: [
            createColumn({ id: 'col-A' }),
            createColumn({ id: 'col-B' }),
            createColumn({ id: 'col-C' }),
          ],
        })],
      });
      const result = attributeListReducer(state, AttributeListActions.changeColumnPosition({
        dataId: 'data-1', columnId: 'col-A', previousColumn: 'col-B',
      }));
      expect(result.data[0].columns.map(c => c.id)).toEqual([ 'col-B', 'col-A', 'col-C' ]);
    });

    test('returns unchanged data when columnId not found', () => {
      const data = createData({
        id: 'data-1',
        columns: [ createColumn({ id: 'col-A' }), createColumn({ id: 'col-B' }) ],
      });
      const state = createState({ data: [data] });
      const result = attributeListReducer(state, AttributeListActions.changeColumnPosition({
        dataId: 'data-1', columnId: 'nonexistent', previousColumn: 'col-A',
      }));
      expect(result.data[0].columns).toEqual(data.columns);
    });
  });

  describe('toggleColumnVisible', () => {
    test('hides a visible column', () => {
      const state = createState({
        data: [createData({
          id: 'data-1',
          columns: [createColumn({ id: 'col-1', visible: true })],
        })],
      });
      const result = attributeListReducer(state, AttributeListActions.toggleColumnVisible({ dataId: 'data-1', columnId: 'col-1' }));
      expect(result.data[0].columns[0].visible).toBe(false);
    });

    test('shows a hidden column', () => {
      const state = createState({
        data: [createData({
          id: 'data-1',
          columns: [createColumn({ id: 'col-1', visible: false })],
        })],
      });
      const result = attributeListReducer(state, AttributeListActions.toggleColumnVisible({ dataId: 'data-1', columnId: 'col-1' }));
      expect(result.data[0].columns[0].visible).toBe(true);
    });
  });

  describe('toggleAllColumnsVisible', () => {
    test('makes all columns visible when some are hidden', () => {
      const state = createState({
        data: [createData({
          id: 'data-1',
          columns: [
            createColumn({ id: 'col-1', visible: true }),
            createColumn({ id: 'col-2', visible: false }),
          ],
        })],
      });
      const result = attributeListReducer(state, AttributeListActions.toggleAllColumnsVisible({ dataId: 'data-1' }));
      expect(result.data[0].columns.every(c => c.visible)).toBe(true);
    });

    test('hides all columns when all are visible', () => {
      const state = createState({
        data: [createData({
          id: 'data-1',
          columns: [
            createColumn({ id: 'col-1', visible: true }),
            createColumn({ id: 'col-2', visible: true }),
          ],
        })],
      });
      const result = attributeListReducer(state, AttributeListActions.toggleAllColumnsVisible({ dataId: 'data-1' }));
      expect(result.data[0].columns.every(c => !c.visible)).toBe(true);
    });
  });

  describe('setSelectedDataId', () => {
    test('updates selectedDataId and sets loadingData on tab', () => {
      const state = createState({
        tabs: [createTab({ id: 'tab-1', selectedDataId: 'data-1', loadingData: false })],
      });
      const result = attributeListReducer(state, AttributeListActions.setSelectedDataId({ tabId: 'tab-1', dataId: 'data-2' }));
      expect(result.tabs[0].selectedDataId).toBe('data-2');
      expect(result.tabs[0].loadingData).toBe(true);
    });
  });

});
