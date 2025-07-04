import { of } from 'rxjs';
import { createMockStore } from '@ngrx/store/testing';
import { selectAttributeListData, selectAttributeListTabs } from '../state/attribute-list.selectors';
import { selectViewerId } from '../../../state/core.selectors';
import { AttributeListDataService } from './attribute-list-data.service';
import {
  AttributeType, FeaturesResponseModel, getColumnMetadataModel, getFeatureModel, TailormapApiV1ServiceModel,
} from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { FilterService } from '../../../filter/services/filter.service';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { FeatureUpdatedService } from '../../../services/feature-updated.service';

const setup = (
  features?: FeaturesResponseModel,
  fillStore?: boolean,
  filters?: Map<string, string | null>,
) => {
  const api = {
    getFeatures$: jest.fn(() => {
      return of(features);
    }),
  } as unknown as TailormapApiV1ServiceModel;
  const tabs: AttributeListTabModel[] = [
    { id: '1', layerId: '1', label: 'TEST 1', selectedDataId: '1', loadingData: false, initialDataLoaded: false },
    { id: '2', layerId: '2', label: 'TEST 2', selectedDataId: '2', loadingData: false, initialDataLoaded: false },
  ];
  const data: AttributeListDataModel[] = [
    { id: '1', columns: [], tabId: '1', pageIndex: 0, pageSize: 10, rows: [], totalCount: null, sortDirection: '' },
    { id: '2', columns: [], tabId: '2', pageIndex: 0, pageSize: 20, rows: [], totalCount: null, sortDirection: '' },
  ];
  const store = createMockStore({
    selectors: [
      { selector: selectAttributeListTabs, value: fillStore ? tabs : [] },
      { selector: selectAttributeListData, value: fillStore ? data : [] },
      { selector: selectViewerId, value: '1' },
    ],
  }) as Store;
  const filterService = {
    getChangedFilters$: jest.fn(() => of(filters || new Map())),
    getFilterForLayer: jest.fn(() => undefined),
  } as unknown as FilterService;
  const featureUpdatedService = new FeatureUpdatedService({ refreshLayer: of() } as any);
  const service = new AttributeListDataService(api, store, filterService, featureUpdatedService);
  return {
    service,
    api,
    store,
    filterService,
  };
};

describe('AttributeListDataService', () => {

  it('creates service', () => {
    const { service, filterService, store } = setup();
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
        getColumnMetadataModel({ key: 'prop2' }),
        getColumnMetadataModel({ key: 'geom', type: AttributeType.GEOMETRY }),
      ],
      pageSize: 10,
      page: 0,
      total: 2,
      template: null,
    };
    const { service, api } = setup(response, true);
    service.loadDataForTab$('1').subscribe(result => {
      expect(api.getFeatures$).toHaveBeenCalledWith({
        layerId: '1',
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
