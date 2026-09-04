import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  selectAttributeListData, selectAttributeListTabs, selectAttributeListVisible, selectInitialDataSort,
} from '../state/attribute-list.selectors';
import { selectViewerId } from '../../../state/core.selectors';
import { AttributeListDataService } from './attribute-list-data.service';
import {
  AttributeType, FeaturesResponseModel, getColumnMetadataModel, getFeatureModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel,
} from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { FilterService } from '../../../filter/services/filter.service';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { FeatureUpdatedService } from '../../../services/feature-updated.service';
import { MapService } from '@tailormap-viewer/map';
import { selectLayer, selectLayers, selectVisibleLayersWithAttributes } from '../../../map';
import { ATTRIBUTE_LIST_DEFAULT_SOURCE } from '../models/attribute-list-default-source.const';
import { AttributeListApiService } from './attribute-list-api.service';
import * as AttributeListActions from '../state/attribute-list.actions';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { createDummyAttributeListData, createDummyRows, getLoadedStoreWithMultipleTabs } from '../state/mocks/attribute-list-state-test-data';
import { LoadAttributeListDataResultModel } from '../models/load-attribute-list-data-result.model';

const setup = (
  features?: FeaturesResponseModel,
  fillStore?: boolean,
  filters?: Map<string, string | null>,
) => {
  const api = {
    getFeatures$: jest.fn(() => of(features)),
  } as unknown as TailormapApiV1ServiceModel;

  const tabs: AttributeListTabModel[] = [
    { tabSourceId: ATTRIBUTE_LIST_DEFAULT_SOURCE, id: '1', layerId: '1', label: 'TEST 1', selectedDataId: '1', initialDataId: '1', loadingData: false, initialDataLoaded: false },
    { tabSourceId: ATTRIBUTE_LIST_DEFAULT_SOURCE, id: '2', layerId: '2', label: 'TEST 2', selectedDataId: '2', initialDataId: '2', loadingData: false, initialDataLoaded: false },
  ];
  const data: AttributeListDataModel[] = [
    { id: '1', columns: [], tabId: '1', pageIndex: 0, pageSize: 10, rows: [], totalCount: null, sortDirection: '' },
    { id: '2', columns: [], tabId: '2', pageIndex: 0, pageSize: 20, rows: [], totalCount: null, sortDirection: '' },
  ];
  const store = createMockStore({
    selectors: [
      { selector: selectAttributeListVisible, value: fillStore },
      { selector: selectAttributeListTabs, value: fillStore ? tabs : [] },
      { selector: selectAttributeListData, value: fillStore ? data : [] },
      { selector: selectViewerId, value: '1' },
      { selector: selectVisibleLayersWithAttributes, value: [{ id: '1', title: '' }, { id: '2', title: '' }] },
      { selector: selectInitialDataSort, value: [] },
      { selector: selectLayers, value: [{ id: '1', layerName: 'layer1', title: '' }, { id: '2', layerName: 'layer2', title: '' }] },
    ],
  }) as Store;

  const filterService = {
    getChangedFilters$: jest.fn(() => of(filters || new Map())),
    getFilterForLayer: jest.fn(() => undefined),
  };

  const mapServiceMock = { refreshLayer: jest.fn() };

  TestBed.configureTestingModule({
    providers: [
      { provide: TAILORMAP_API_V1_SERVICE, useValue: api },
      { provide: Store, useValue: store },
      { provide: FilterService, useValue: filterService },
      { provide: MapService, useValue: mapServiceMock },
      FeatureUpdatedService,
      AttributeListDataService,
    ],
  });

  const service = TestBed.inject(AttributeListDataService);
  return {
    service,
    api,
    store,
    filterService,
  };
};

describe('AttributeListDataService', () => {

  // `createMockStore`'s selector overrides live on the (module-level, shared) selector instances
  // themselves, so they leak into other describe blocks in this file unless explicitly reset.
  afterEach(() => {
    (TestBed.inject(Store) as MockStore<unknown>).resetSelectors();
  });

  it('creates service', () => {
    const { service, filterService } = setup();
    expect(service).not.toBeUndefined();
    expect(filterService.getChangedFilters$).toHaveBeenCalled();
  });

  it('gets error when requesting for non-existing tab', done => {
    const { service } = setup();
    service.loadDataForTab$('1').subscribe(result => {
      expect(result.success).toBe(false);
      expect(result.errorMessage).toEqual('Failed to load attribute list data');
      done();
    });
  });

  it('returns data for tab', done => {
    const response: FeaturesResponseModel = {
      features: [
        getFeatureModel({ __fid: '1', attributes: { prop1: 'test', prop2: 'another test', geom: '' } }),
        getFeatureModel({ __fid: '2', attributes: { prop1: 'test 2', prop2: 'another test 2', geom: '' } }),
      ],
      columnMetadata: [
        getColumnMetadataModel(),
        getColumnMetadataModel({ name: 'prop2' }),
        getColumnMetadataModel({ name: 'geom', type: AttributeType.GEOMETRY }),
      ],
      pageSize: 10,
      page: 0,
      total: 2,
      template: null,
    };
    const { service, api } = setup(response, true);
    const apiService = TestBed.inject(AttributeListApiService);
    apiService.initDefaultAttributeListSource();
    service.loadDataForTab$('1').subscribe(result => {
      expect(api.getFeatures$).toHaveBeenCalledWith({
        layerId: '1',
        layerName: 'layer1',
        applicationId: '1',
        page: 0,
        filter: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
      expect(result.success).toBe(true);
      expect(result.totalCount).toBe(2);
      done();
    });
  });

});

const createResult = (id: string, success = true): LoadAttributeListDataResultModel => ({
  id,
  success,
  totalCount: 0,
  columns: [],
  rows: [],
  pageSize: 10,
});

describe('AttributeListDataService - reload triggers', () => {

  const setupReloadTest = (loadDataForTabMock?: jest.Mock, initialState = getLoadedStoreWithMultipleTabs()) => {
    const loadDataForTab$ = loadDataForTabMock ?? jest.fn((tabId: string) => of(createResult(tabId)));
    const notifyCheckedRowsChanged = jest.fn();
    const getFeatures$ = jest.fn(() => of({ features: [] }));
    TestBed.configureTestingModule({
      providers: [
        AttributeListDataService,
        provideMockStore({
          initialState,
          selectors: [{ selector: selectViewerId, value: 'app1' }],
        }),
        { provide: FilterService, useValue: { getChangedFilters$: () => of(new Map()), getFilterForLayer: () => undefined } },
        { provide: FeatureUpdatedService, useValue: { featureUpdated$: of() } },
        { provide: AttributeListManagerService, useValue: { notifyCheckedRowsChanged, getFeatures$ } },
        getMapServiceMock().provider,
      ],
    });
    const service = TestBed.inject(AttributeListDataService);
    jest.spyOn(service, 'loadDataForTab$').mockImplementation(loadDataForTab$);
    const store = TestBed.inject(Store);
    const dispatched: unknown[] = [];
    jest.spyOn(store, 'dispatch').mockImplementation(action => { dispatched.push(action); });
    return { service, loadDataForTab$, dispatched, notifyCheckedRowsChanged };
  };

  describe('debounced reload', () => {

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('loads data after the debounce period', () => {
      const { service, loadDataForTab$, dispatched } = setupReloadTest();
      service.loadData('1');
      expect(loadDataForTab$).not.toHaveBeenCalled();
      jest.advanceTimersByTime(50);
      expect(loadDataForTab$).toHaveBeenCalledTimes(1);
      expect(loadDataForTab$).toHaveBeenCalledWith('1');
      expect(dispatched).toEqual(expect.arrayContaining([
        AttributeListActions.loadDataSuccess({ tabId: '1', data: createResult('1') }),
      ]));
    });

    it('loads data only once when multiple triggers for the same tab arrive quickly', () => {
      const { service, loadDataForTab$, dispatched } = setupReloadTest();
      service.loadData('1');
      service.updatePage('1', 2);
      jest.advanceTimersByTime(50);
      expect(loadDataForTab$).toHaveBeenCalledTimes(1);
      expect(dispatched).toEqual(expect.arrayContaining([
        AttributeListActions.loadDataSuccess({ tabId: '1', data: createResult('1') }),
      ]));
    });

    it('postpones loading while triggers for the same tab keep arriving within the debounce period', () => {
      const { service, loadDataForTab$ } = setupReloadTest();
      service.loadData('1');
      jest.advanceTimersByTime(30);
      service.loadData('1');
      jest.advanceTimersByTime(30);
      expect(loadDataForTab$).not.toHaveBeenCalled();
      jest.advanceTimersByTime(20);
      expect(loadDataForTab$).toHaveBeenCalledTimes(1);
    });

    it('loads data for different tabs independently without debouncing each other', () => {
      const { service, loadDataForTab$, dispatched } = setupReloadTest();
      service.loadData('1');
      service.loadData('2');
      jest.advanceTimersByTime(50);
      expect(loadDataForTab$).toHaveBeenCalledTimes(2);
      expect(loadDataForTab$).toHaveBeenCalledWith('1');
      expect(loadDataForTab$).toHaveBeenCalledWith('2');
      expect(dispatched).toEqual(expect.arrayContaining([
        AttributeListActions.loadDataSuccess({ tabId: '1', data: createResult('1') }),
        AttributeListActions.loadDataSuccess({ tabId: '2', data: createResult('2') }),
      ]));
    });

    it('dispatches loadDataFailed when loading fails', () => {
      const loadDataForTab$ = jest.fn((tabId: string) => of(createResult(tabId, false)));
      const { service, dispatched } = setupReloadTest(loadDataForTab$);
      service.loadData('1');
      jest.advanceTimersByTime(50);
      expect(dispatched).toEqual(expect.arrayContaining([
        AttributeListActions.loadDataFailed({ tabId: '1', data: createResult('1', false) }),
      ]));
    });

  });

  describe('notifyCheckedRowsChanged', () => {

    const getStoreWithCheckedRows = () => getLoadedStoreWithMultipleTabs({
      data: [
        createDummyAttributeListData({
          id: '1',
          tabId: '1',
          rows: createDummyRows(10),
          checkedRows: [{ id: '1', __fid: '1' }, { id: '3', __fid: '3' }],
        }),
      ],
    });

    it('notifies the manager service with the full checked set when a row is checked', () => {
      const { service, notifyCheckedRowsChanged } = setupReloadTest(undefined, getStoreWithCheckedRows());
      service.updateRowChecked('1', '1', '3', true);
      expect(notifyCheckedRowsChanged).toHaveBeenCalledTimes(1);
      expect(notifyCheckedRowsChanged).toHaveBeenCalledWith(ATTRIBUTE_LIST_DEFAULT_SOURCE, {
        applicationId: 'app1',
        layerId: '1',
        checkedRows: [{ __fid: '1' }, { __fid: '3' }],
      });
    });

    it('notifies the manager service when all rows are checked or unchecked', () => {
      const { service, notifyCheckedRowsChanged } = setupReloadTest(undefined, getStoreWithCheckedRows());
      service.updateAllRowsChecked('1', '1', true);
      expect(notifyCheckedRowsChanged).toHaveBeenCalledTimes(1);
      expect(notifyCheckedRowsChanged).toHaveBeenCalledWith(ATTRIBUTE_LIST_DEFAULT_SOURCE, {
        applicationId: 'app1',
        layerId: '1',
        checkedRows: [{ __fid: '1' }, { __fid: '3' }],
      });
    });

    it('does not notify for unknown data ids', () => {
      const { service, notifyCheckedRowsChanged } = setupReloadTest(undefined, getStoreWithCheckedRows());
      service.updateRowChecked('1', 'unknown', '3', true);
      expect(notifyCheckedRowsChanged).not.toHaveBeenCalled();
    });

  });

});
