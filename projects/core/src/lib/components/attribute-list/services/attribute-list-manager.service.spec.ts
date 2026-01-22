import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { createMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { AttributeListApiService } from './attribute-list-api.service';
import { selectAttributeListTabs, selectAttributeListVisible } from '../state/attribute-list.selectors';
import { selectVisibleLayersWithAttributes } from '../../../map/state/map.selectors';
import {
  AttributeListApiServiceModel,
  CanExpandRowParams,
  FeatureDetailsModel,
  GetFeatureDetailsParams,
  GetFeaturesParams,
  GetLayerExportCapabilitiesParams,
  GetLayerExportParams,
  GetLayerExportResponse,
  GetUniqueValuesParams,
} from '../models/attribute-list-api-service.model';
import { AttributeListSourceModel } from '../models/attribute-list-source.model';
import { FeaturesResponseModel, LayerExportCapabilitiesModel, UniqueValuesResponseModel } from '@tailormap-viewer/api';
import { ATTRIBUTE_LIST_DEFAULT_SOURCE } from '../models/attribute-list-default-source.const';

describe('AttributeListManagerService', () => {
  let managerService: AttributeListManagerService;
  let mockApiService: Record<keyof AttributeListApiServiceModel, jest.Mock>;

  const setup = () => {
    const store = createMockStore({
      selectors: [
        { selector: selectAttributeListVisible, value: false },
        { selector: selectAttributeListTabs, value: [] },
        { selector: selectVisibleLayersWithAttributes, value: [] },
      ],
    }) as Store;

    mockApiService = {
      getFeatures$: jest.fn(),
      getLayerExportCapabilities$: jest.fn(),
      getLayerExport$: jest.fn(),
      getUniqueValues$: jest.fn(),
      canExpandRow$: jest.fn(),
      getFeatureDetails$: jest.fn(),
    } as Record<keyof AttributeListApiServiceModel, jest.Mock>;

    TestBed.configureTestingModule({
      providers: [
        AttributeListManagerService,
        { provide: Store, useValue: store },
        { provide: AttributeListApiService, useValue: mockApiService },
      ],
    });

    managerService = TestBed.inject(AttributeListManagerService);
    return { service: managerService, store, mockApiService };
  };

  beforeEach(() => {
    const { service } = setup();
    managerService = service;
  });

  it('should be created', () => {
    expect(managerService).toBeTruthy();
  });

  describe('canExpandRow', () => {
    it('should return false when source is not found', (done) => {
      const params: CanExpandRowParams = {
        applicationId: '1',
        layerId: '1',
      };

      managerService.canExpandRow$('non-existent-source', params)
        .subscribe(result => {
          expect(result).toBe(false);
          done();
        });
    });

    it('should return false when source dataLoader does not have canExpandRow method', (done) => {
      const params: CanExpandRowParams = {
        applicationId: '1',
        layerId: '1',
      };

      const dataLoaderWithoutMethod: AttributeListApiServiceModel = {
        getFeatures$: jest.fn(),
        getLayerExportCapabilities$: jest.fn(),
        getLayerExport$: jest.fn(),
        getUniqueValues$: jest.fn(),
      } as any;

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: dataLoaderWithoutMethod,
      };

      managerService.addAttributeListSource(source);

      managerService.canExpandRow$('test-source', params)
        .subscribe(result => {
          expect(result).toBe(false);
          done();
        });
    });

    it('should return result from dataLoader canExpandRow when available', (done) => {
      const params: CanExpandRowParams = {
        applicationId: '1',
        layerId: '1',
      };

      mockApiService.canExpandRow$.mockReturnValue(of(true));

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: mockApiService,
      };

      managerService.addAttributeListSource(source);

      managerService.canExpandRow$('test-source', params)
        .subscribe(result => {
          expect(result).toBe(true);
          expect(mockApiService.canExpandRow$).toHaveBeenCalledWith(params);
          done();
        });
    });

    it('should return false from dataLoader canExpandRow when it returns false', (done) => {
      const params: CanExpandRowParams = {
        applicationId: '1',
        layerId: '1',
      };

      mockApiService.canExpandRow$.mockReturnValue(of(false));

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: mockApiService,
      };

      managerService.addAttributeListSource(source);

      managerService.canExpandRow$('test-source', params)
        .subscribe(result => {
          expect(result).toBe(false);
          expect(mockApiService.canExpandRow$).toHaveBeenCalledWith(params);
          done();
        });
    });
  });

  describe('getFeatureDetails$', () => {
    it('should return null when source is not found', (done) => {
      const params: GetFeatureDetailsParams = {
        applicationId: '1',
        layerId: '1',
        __fid: 'feature-1',
      };

      managerService.getFeatureDetails$('non-existent-source', params).subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when source dataLoader does not have getFeatureDetails$ method', (done) => {
      const params: GetFeatureDetailsParams = {
        applicationId: '1',
        layerId: '1',
        __fid: 'feature-1',
      };

      const dataLoaderWithoutMethod: AttributeListApiServiceModel = {
        getFeatures$: jest.fn(),
        getLayerExportCapabilities$: jest.fn(),
        getLayerExport$: jest.fn(),
        getUniqueValues$: jest.fn(),
      } as any;

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: dataLoaderWithoutMethod,
      };

      managerService.addAttributeListSource(source);

      managerService.getFeatureDetails$('test-source', params).subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return feature details from dataLoader when available', (done) => {
      const params: GetFeatureDetailsParams = {
        applicationId: '1',
        layerId: '1',
        __fid: 'feature-1',
      };

      const featureDetails: FeatureDetailsModel = {
        __fid: 'feature-1',
        details: [
          {
            name: 'Related Data',
            columns: [
              { label: 'Name', key: 'name' },
              { label: 'Value', key: 'value' },
            ],
            attributes: [
              { name: 'Item 1', value: 'Value 1' },
              { name: 'Item 2', value: 'Value 2' },
            ],
          },
        ],
      };

      mockApiService.getFeatureDetails$.mockReturnValue(of(featureDetails));

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: mockApiService,
      };

      managerService.addAttributeListSource(source);

      managerService.getFeatureDetails$('test-source', params).subscribe(result => {
        expect(result).toEqual(featureDetails);
        expect(mockApiService.getFeatureDetails$).toHaveBeenCalledWith(params);
        done();
      });
    });

    it('should return null from dataLoader when feature is not found', (done) => {
      const params: GetFeatureDetailsParams = {
        applicationId: '1',
        layerId: '1',
        __fid: 'non-existent-feature',
      };

      mockApiService.getFeatureDetails$.mockReturnValue(of(null));

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: mockApiService,
      };

      managerService.addAttributeListSource(source);

      managerService.getFeatureDetails$('test-source', params).subscribe(result => {
        expect(result).toBeNull();
        expect(mockApiService.getFeatureDetails$).toHaveBeenCalledWith(params);
        done();
      });
    });
  });

  describe('getFeatures$', () => {
    it('should return empty response when source is not found', (done) => {
      const params: GetFeaturesParams = {
        applicationId: '1',
        layerId: '1',
      };

      managerService.getFeatures$('non-existent-source', params).subscribe(result => {
        expect(result).toEqual({ features: [], columnMetadata: [], total: null, page: null, pageSize: null, template: null });
        done();
      });
    });

    it('should return features from dataLoader when source is found', (done) => {
      const params: GetFeaturesParams = {
        applicationId: '1',
        layerId: '1',
        page: 0,
      };

      const featuresResponse: FeaturesResponseModel = {
        features: [{ __fid: 'f1', attributes: { name: 'Test' } }],
        columnMetadata: [],
        total: 1,
        page: 0,
        pageSize: 100,
        template: null,
      };

      mockApiService.getFeatures$.mockReturnValue(of(featuresResponse));

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: mockApiService,
      };

      managerService.addAttributeListSource(source);

      managerService.getFeatures$('test-source', params).subscribe(result => {
        expect(result).toEqual(featuresResponse);
        expect(mockApiService.getFeatures$).toHaveBeenCalledWith(params);
        done();
      });
    });
  });

  describe('getLayerExportCapabilities$', () => {
    it('should return empty capabilities when source is not found', (done) => {
      const params: GetLayerExportCapabilitiesParams = {
        applicationId: '1',
        layerId: '1',
      };

      managerService.getLayerExportCapabilities$('non-existent-source', params).subscribe(result => {
        expect(result).toEqual({ exportable: false, outputFormats: [] });
        done();
      });
    });

    it('should return export capabilities from dataLoader when source is found', (done) => {
      const params: GetLayerExportCapabilitiesParams = {
        applicationId: '1',
        layerId: '1',
      };

      const capabilities: LayerExportCapabilitiesModel = {
        exportable: true,
        outputFormats: [ 'csv', 'shp', 'gpkg' ],
      };

      mockApiService.getLayerExportCapabilities$.mockReturnValue(of(capabilities));

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: mockApiService,
      };

      managerService.addAttributeListSource(source);

      managerService.getLayerExportCapabilities$('test-source', params).subscribe(result => {
        expect(result).toEqual(capabilities);
        expect(mockApiService.getLayerExportCapabilities$).toHaveBeenCalledWith(params);
        done();
      });
    });
  });

  describe('getLayerExport$', () => {
    it('should return null when source is not found', (done) => {
      const params: GetLayerExportParams = {
        applicationId: '1',
        layerId: '1',
        outputFormat: 'csv',
      };

      managerService.getLayerExport$('non-existent-source', params).subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return export response from dataLoader when source is found', (done) => {
      const params: GetLayerExportParams = {
        applicationId: '1',
        layerId: '1',
        outputFormat: 'csv',
      };

      const exportResponse: GetLayerExportResponse = {
        file: new Blob(['test'], { type: 'text/csv' }),
        fileName: 'export.csv',
      };

      mockApiService.getLayerExport$.mockReturnValue(of(exportResponse));

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: mockApiService,
      };

      managerService.addAttributeListSource(source);

      managerService.getLayerExport$('test-source', params).subscribe(result => {
        expect(result).toEqual(exportResponse);
        expect(mockApiService.getLayerExport$).toHaveBeenCalledWith(params);
        done();
      });
    });
  });

  describe('getUniqueValues$', () => {
    it('should return empty response when source is not found', (done) => {
      const params: GetUniqueValuesParams = {
        applicationId: '1',
        layerId: '1',
        attribute: 'status',
      };

      managerService.getUniqueValues$('non-existent-source', params).subscribe(result => {
        expect(result).toEqual({ values: [], filterApplied: false });
        done();
      });
    });

    it('should return unique values from dataLoader when source is found', (done) => {
      const params: GetUniqueValuesParams = {
        applicationId: '1',
        layerId: '1',
        attribute: 'status',
      };

      const uniqueValuesResponse: UniqueValuesResponseModel = {
        values: [ 'active', 'inactive', 'pending' ],
        filterApplied: true,
      };

      mockApiService.getUniqueValues$.mockReturnValue(of(uniqueValuesResponse));

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: mockApiService,
      };

      managerService.addAttributeListSource(source);

      managerService.getUniqueValues$('test-source', params).subscribe(result => {
        expect(result).toEqual(uniqueValuesResponse);
        expect(mockApiService.getUniqueValues$).toHaveBeenCalledWith(params);
        done();
      });
    });
  });

  describe('addAttributeListSource', () => {
    it('should add a new source to the sources list', () => {
      const source1: AttributeListSourceModel = {
        id: 'source-1',
        tabs$: of([{ id: 'layer-1', label: 'Layer 1' }]),
        dataLoader: mockApiService,
      };

      const source2: AttributeListSourceModel = {
        id: 'source-2',
        tabs$: of([{ id: 'layer-2', label: 'Layer 2' }]),
        dataLoader: mockApiService,
      };

      managerService.addAttributeListSource(source1);
      managerService.addAttributeListSource(source2);

      // Verify both sources are accessible by testing getFeatures$ on each
      const params: GetFeaturesParams = { applicationId: '1', layerId: '1' };
      const featuresResponse: FeaturesResponseModel = {
        features: [],
        columnMetadata: [],
        total: 0,
        page: 0,
        pageSize: 100,
        template: null,
      };

      mockApiService.getFeatures$.mockReturnValue(of(featuresResponse));

      let source1Found = false;
      let source2Found = false;

      managerService.getFeatures$('source-1', params).subscribe(result => {
        source1Found = result === featuresResponse;
      });

      managerService.getFeatures$('source-2', params).subscribe(result => {
        source2Found = result === featuresResponse;
      });

      expect(source1Found).toBe(true);
      expect(source2Found).toBe(true);
    });
  });

  describe('initDefaultAttributeListSource', () => {
    it('should add default attribute list source', () => {
      managerService.initDefaultAttributeListSource();

      // Verify the default source is added by checking that it can be accessed
      // Since the default source uses the mock API service, we can test getFeatures$
      const params: GetFeaturesParams = { applicationId: '1', layerId: '1' };
      const featuresResponse: FeaturesResponseModel = {
        features: [],
        columnMetadata: [],
        total: 0,
        page: 0,
        pageSize: 100,
        template: null,
      };

      mockApiService.getFeatures$.mockReturnValue(of(featuresResponse));

      let sourceFound = false;
      managerService.getFeatures$(ATTRIBUTE_LIST_DEFAULT_SOURCE, params).subscribe(result => {
        sourceFound = result === featuresResponse;
      });

      expect(sourceFound).toBe(true);
    });
  });

  describe('static properties', () => {
    it('should have correct EMPTY_ATTRIBUTE_LIST_TAB structure', () => {
      expect(AttributeListManagerService.EMPTY_ATTRIBUTE_LIST_TAB).toEqual({
        id: '',
        label: '',
        selectedDataId: '',
        initialDataId: '',
        initialDataLoaded: false,
        loadingData: false,
        tabSourceId: '',
      });
    });

    it('should have correct EMPTY_ATTRIBUTE_LIST_DATA structure', () => {
      expect(AttributeListManagerService.EMPTY_ATTRIBUTE_LIST_DATA).toEqual({
        id: '',
        tabId: '',
        columns: [],
        rows: [],
        pageIndex: 1,
        pageSize: 100,
        totalCount: null,
        sortDirection: '',
      });
    });
  });
});
