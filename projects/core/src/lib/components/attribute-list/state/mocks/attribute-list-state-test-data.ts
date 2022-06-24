import { AttributeListState, attributeListStateKey, initialAttributeListState } from '../attribute-list.state';
import { AttributeListRowModel } from '../../models/attribute-list-row.model';
import { AttributeListTabModel } from '../../models/attribute-list-tab.model';
import { AttributeListManagerService } from '../../services/attribute-list-manager.service';
import { AttributeListDataModel } from '../../models/attribute-list-data.model';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';

export const createDummyAttributeListTab = (
  overrides?: Partial<AttributeListTabModel>,
): AttributeListTabModel => ({
  id: '1',
  selectedDataId: '1',
  loadingData: true,
  layerId: 1,
  initialDataLoaded: false,
  label: 'First tab',
  loadingError: '',
  ...(overrides || {}),
});

export const createDummyAttributeListData = (
  overrides?: Partial<AttributeListDataModel>,
): AttributeListDataModel => ({
  ...AttributeListManagerService.EMPTY_ATTRIBUTE_LIST_DATA,
  id: '1',
  tabId: '1',
  ...(overrides || {}),
});

export const createDummyRow = (
  id: string,
  overrides?: Partial<AttributeListRowModel>,
): AttributeListRowModel => ({
  id,
  __fid: id,
  selected: false,
  attributes: {
    attribute1: id + ': Test',
    attribute2: id + ': Some other value',
    attribute3: id + ': The last value',
  },
  ...(overrides || {}),
});

export const createDummyRows = (
  count: number,
  rowOverride?: (index: number) => Partial<AttributeListRowModel>,
): AttributeListRowModel[] => {
  const rows: AttributeListRowModel[] = [];
  for (let i = 0; i < count; i++) {
    rows.push(createDummyRow(`${i+1}`, rowOverride ? rowOverride(i) : undefined));
  }
  return rows;
};

const getStore = (overrides?: Partial<AttributeListState>) => {
  return {
    [attributeListStateKey]: {
      ...initialAttributeListState,
      visible: true,
      height: 100,
      ...overrides,
    },
  };
};

export const getLoadingStore = (overrides?: Partial<AttributeListState>) => {
  return getStore({
    selectedTabId: '1',
    tabs: [
      createDummyAttributeListTab(),
    ],
    data: [
      createDummyAttributeListData(),
    ],
    ...overrides,
  });
};

export const getLoadedStoreNoRows = (overrides?: Partial<AttributeListState>) => {
  return getStore({
    selectedTabId: '1',
    tabs: [
      createDummyAttributeListTab({ loadingData: false, initialDataLoaded: true }),
    ],
    data: [
      createDummyAttributeListData(),
    ],
    ...overrides,
  });
};

export const getLoadedStoreWithRows = (overrides?: Partial<AttributeListState>) => {
  return getStore({
    selectedTabId: '1',
    tabs: [
      createDummyAttributeListTab({ loadingData: false, initialDataLoaded: true }),
    ],
    data: [
      createDummyAttributeListData({
        id: '1',
        tabId: '1',
        rows: createDummyRows(10),
        columns: [{
          id: 'attribute1', label: 'Attribute 1', visible: true, type: FeatureAttributeTypeEnum.STRING,
        }, {
          id: 'attribute2', label: 'Attribute 2', visible: true, type: FeatureAttributeTypeEnum.STRING,
        }, {
          id: 'attribute3', label: 'Attribute 3', visible: true, type: FeatureAttributeTypeEnum.STRING,
        }],
      }),
    ],
    ...overrides,
  });
};
