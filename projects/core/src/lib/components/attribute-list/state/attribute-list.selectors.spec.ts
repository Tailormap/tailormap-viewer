import {
  selectTabsForVisibleLayers,
  selectIsLoadingTabs,
  selectAttributeListTab,
  selectDataWithSort,
  selectAttributeListTabsSort,
  selectAttributeListTabData,
} from './attribute-list.selectors';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { AttributeListInitialDataSortModel } from '../models/attribute-list-initial-data-sort.model';
import { HiddenLayerFunctionality } from '@tailormap-viewer/api';
import { ExtendedAppLayerModel } from '../../../map/models';

const createLayer = (overrides: Partial<ExtendedAppLayerModel> = {}): ExtendedAppLayerModel =>
  ({ id: 'layer-1', title: 'Layer 1', layerName: 'layer-1', hiddenFunctionality: [], ...overrides } as unknown as ExtendedAppLayerModel);

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

const createSort = (overrides: Partial<AttributeListInitialDataSortModel> = {}): AttributeListInitialDataSortModel => ({
  tabSourceId: 'source-1',
  layerId: 'layer-1',
  sortedColumn: 'name',
  sortDirection: 'asc',
  source: 'config',
  ...overrides,
});

describe('AttributeListSelectors', () => {

  describe('selectTabsForVisibleLayers', () => {
    const projector = selectTabsForVisibleLayers.projector;

    test('maps layers to id/label objects', () => {
      const layers = [createLayer({ id: 'l1', title: 'Layer 1' })];
      expect(projector(layers)).toEqual([{ id: 'l1', label: 'Layer 1' }]);
    });

    test('uses layerName as label when title is absent', () => {
      const layers = [createLayer({ id: 'l1', title: undefined as unknown as string, layerName: 'layer-one' })];
      expect(projector(layers)).toEqual([{ id: 'l1', label: 'layer-one' }]);
    });

    test('filters out layers with attributeList in hiddenFunctionality', () => {
      const layers = [
        createLayer({ id: 'l1', title: 'Visible' }),
        createLayer({ id: 'l2', title: 'Hidden', hiddenFunctionality: [HiddenLayerFunctionality.attributeList] }),
      ];
      const result = projector(layers);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('l1');
    });

    test('returns empty array when no layers are provided', () => {
      expect(projector([])).toEqual([]);
    });

    test('returns all layers when none have attribute list hidden', () => {
      const layers = [
        createLayer({ id: 'l1', title: 'A' }),
        createLayer({ id: 'l2', title: 'B', hiddenFunctionality: [HiddenLayerFunctionality.featureInfo] }),
      ];
      expect(projector(layers)).toHaveLength(2);
    });
  });

  describe('selectIsLoadingTabs', () => {
    const projector = selectIsLoadingTabs.projector;

    test('returns true when there are layers but no tabs yet', () => {
      expect(projector([{ id: 'l1', label: 'L' }], [])).toBe(true);
    });

    test('returns false when there are no layers', () => {
      expect(projector([], [])).toBe(false);
    });

    test('returns false when tabs have already been created', () => {
      const tabs = [createTab()];
      expect(projector([{ id: 'l1', label: 'L' }], tabs)).toBe(false);
    });

    test('returns false when there are multiple tabs created', () => {
      const tabs = [ createTab({ id: 'tab-1' }), createTab({ id: 'tab-2' }) ];
      expect(projector([{ id: 'l1', label: 'L' }], tabs)).toBe(false);
    });
  });

  describe('selectAttributeListTab', () => {
    const tabs = [ createTab({ id: 'tab-1' }), createTab({ id: 'tab-2' }) ];

    test('returns the tab with the matching id', () => {
      const projector = selectAttributeListTab('tab-1').projector;
      expect(projector(tabs)?.id).toBe('tab-1');
    });

    test('returns undefined when no tab matches the id', () => {
      const projector = selectAttributeListTab('tab-99').projector;
      expect(projector(tabs)).toBeUndefined();
    });

    test('returns the correct tab when multiple tabs exist', () => {
      const projector = selectAttributeListTab('tab-2').projector;
      expect(projector(tabs)?.id).toBe('tab-2');
    });
  });

  describe('selectDataWithSort', () => {
    const projector = selectDataWithSort.projector;

    test('returns data unchanged when no initialDataSort entries match', () => {
      const tab = createTab({ id: 'tab-1', tabSourceId: 'source-1', layerId: 'layer-1' });
      const data = createData({ id: 'data-1', tabId: 'tab-1' });
      const sorts: AttributeListInitialDataSortModel[] = [createSort({ tabSourceId: 'source-other' })];

      const result = projector([tab], [data], sorts);
      expect(result[0].sortedColumn).toBeUndefined();
      expect(result[0].sortDirection).toBe('');
    });

    test('applies config sort when no explicit sort is set on data', () => {
      const tab = createTab({ id: 'tab-1', tabSourceId: 'source-1', layerId: 'layer-1' });
      const data = createData({ id: 'data-1', tabId: 'tab-1', sortedColumn: undefined });
      const sorts: AttributeListInitialDataSortModel[] = [createSort({ sortedColumn: 'name', sortDirection: 'desc', source: 'config' })];

      const result = projector([tab], [data], sorts);
      expect(result[0].sortedColumn).toBe('name');
      expect(result[0].sortDirection).toBe('desc');
    });

    test('bookmark sort takes precedence over config sort', () => {
      const tab = createTab({ id: 'tab-1', tabSourceId: 'source-1', layerId: 'layer-1' });
      const data = createData({ id: 'data-1', tabId: 'tab-1', sortedColumn: undefined });
      const sorts: AttributeListInitialDataSortModel[] = [
        createSort({ sortedColumn: 'city', sortDirection: 'asc', source: 'config' }),
        createSort({ sortedColumn: 'name', sortDirection: 'desc', source: 'bookmark' }),
      ];

      const result = projector([tab], [data], sorts);
      expect(result[0].sortedColumn).toBe('name');
      expect(result[0].sortDirection).toBe('desc');
    });

    test('does not override sort when data already has an explicit sortedColumn', () => {
      const tab = createTab({ id: 'tab-1', tabSourceId: 'source-1', layerId: 'layer-1' });
      const data = createData({ id: 'data-1', tabId: 'tab-1', sortedColumn: 'existing', sortDirection: 'asc' });
      const sorts: AttributeListInitialDataSortModel[] = [createSort({ sortedColumn: 'name', sortDirection: 'desc' })];

      const result = projector([tab], [data], sorts);
      expect(result[0].sortedColumn).toBe('existing');
      expect(result[0].sortDirection).toBe('asc');
    });

    test('returns data unchanged when no initialDataSort is provided', () => {
      const tab = createTab();
      const data = createData();
      const result = projector([tab], [data], []);
      expect(result[0]).toBe(data);
    });

    test('handles data whose tab cannot be found', () => {
      const data = createData({ id: 'data-1', tabId: 'missing-tab' });
      const sorts: AttributeListInitialDataSortModel[] = [createSort()];
      // No matching tab means no sort can be applied
      const result = projector([], [data], sorts);
      expect(result[0]).toBe(data);
    });
  });

  describe('selectAttributeListTabsSort', () => {
    const projector = selectAttributeListTabsSort.projector;

    test('returns sort entries for tabs with a sorted column', () => {
      const tab = createTab({ id: 'tab-1', tabSourceId: 'source-1', layerId: 'layer-1', selectedDataId: 'data-1' });
      const data = createData({ id: 'data-1', tabId: 'tab-1', sortedColumn: 'name', sortDirection: 'asc' });

      const result = projector([tab], [data]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ tabSourceId: 'source-1', layerId: 'layer-1', sortedColumn: 'name', sortDirection: 'asc' });
    });

    test('excludes tabs where data has no sortedColumn', () => {
      const tab = createTab({ id: 'tab-1', tabSourceId: 'source-1', layerId: 'layer-1', selectedDataId: 'data-1' });
      const data = createData({ id: 'data-1', tabId: 'tab-1', sortedColumn: undefined });

      const result = projector([tab], [data]);
      expect(result).toHaveLength(0);
    });

    test('excludes tabs where sortDirection is empty', () => {
      const tab = createTab({ id: 'tab-1', tabSourceId: 'source-1', layerId: 'layer-1', selectedDataId: 'data-1' });
      const data = createData({ id: 'data-1', tabId: 'tab-1', sortedColumn: 'name', sortDirection: '' });

      const result = projector([tab], [data]);
      expect(result).toHaveLength(0);
    });

    test('excludes tabs where layerId is undefined', () => {
      const tab = createTab({ id: 'tab-1', tabSourceId: 'source-1', layerId: undefined, selectedDataId: 'data-1' });
      const data = createData({ id: 'data-1', tabId: 'tab-1', sortedColumn: 'name', sortDirection: 'desc' });

      const result = projector([tab], [data]);
      expect(result).toHaveLength(0);
    });

    test('excludes tabs where selectedData cannot be found', () => {
      const tab = createTab({ id: 'tab-1', tabSourceId: 'source-1', layerId: 'layer-1', selectedDataId: 'missing' });
      const data = createData({ id: 'data-1', tabId: 'tab-1', sortedColumn: 'name', sortDirection: 'asc' });

      const result = projector([tab], [data]);
      expect(result).toHaveLength(0);
    });

    test('handles multiple tabs and only returns those with sorts', () => {
      const tab1 = createTab({ id: 'tab-1', tabSourceId: 'src-1', layerId: 'l-1', selectedDataId: 'data-1' });
      const tab2 = createTab({ id: 'tab-2', tabSourceId: 'src-2', layerId: 'l-2', selectedDataId: 'data-2' });
      const data1 = createData({ id: 'data-1', tabId: 'tab-1', sortedColumn: 'name', sortDirection: 'asc' });
      const data2 = createData({ id: 'data-2', tabId: 'tab-2', sortedColumn: undefined });

      const result = projector([ tab1, tab2 ], [ data1, data2 ]);
      expect(result).toHaveLength(1);
      expect(result[0].tabSourceId).toBe('src-1');
    });
  });

  describe('selectAttributeListTabData', () => {
    test('returns only data entries belonging to the given tabId', () => {
      const allData = [
        createData({ id: 'data-1', tabId: 'tab-1' }),
        createData({ id: 'data-2', tabId: 'tab-2' }),
        createData({ id: 'data-3', tabId: 'tab-1' }),
      ];
      const projector = selectAttributeListTabData('tab-1').projector;
      const result = projector(allData);
      expect(result).toHaveLength(2);
      expect(result.every(d => d.tabId === 'tab-1')).toBe(true);
    });

    test('returns an empty array when no data matches the tabId', () => {
      const allData = [createData({ id: 'data-1', tabId: 'tab-2' })];
      const projector = selectAttributeListTabData('tab-1').projector;
      expect(projector(allData)).toEqual([]);
    });

    test('returns all data when all entries belong to the given tabId', () => {
      const allData = [
        createData({ id: 'data-1', tabId: 'tab-1' }),
        createData({ id: 'data-2', tabId: 'tab-1' }),
      ];
      const projector = selectAttributeListTabData('tab-1').projector;
      expect(projector(allData)).toHaveLength(2);
    });
  });

});
