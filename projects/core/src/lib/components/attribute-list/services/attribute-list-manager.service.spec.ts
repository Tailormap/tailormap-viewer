import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { createMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { AttributeListApiService } from './attribute-list-api.service';
import { selectAttributeListTabs, selectAttributeListVisible } from '../state/attribute-list.selectors';
import { selectVisibleLayersWithAttributes } from '../../../map/state/map.selectors';
import { AttributeListApiServiceModel, CanExpandRowParams, FeatureDetailsModel, GetFeatureDetailsParams } from '../models/attribute-list-api-service.model';
import { AttributeListSourceModel } from '../models/attribute-list-source.model';

describe('AttributeListManagerService', () => {
  let service: AttributeListManagerService;
  let mockApiService: jest.Mocked<AttributeListApiServiceModel>;

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
      canExpandRow: jest.fn(),
      getFeatureDetails$: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        AttributeListManagerService,
        { provide: Store, useValue: store },
        { provide: AttributeListApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(AttributeListManagerService);
    return { service, store, mockApiService };
  };

  beforeEach(() => {
    const { service: testService } = setup();
    service = testService;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('canExpandRow', () => {
    it('should return false when source is not found', () => {
      const params: CanExpandRowParams = {
        applicationId: '1',
        layerId: '1',
      };

      const result = service.canExpandRow('non-existent-source', params);

      expect(result).toBe(false);
    });

    it('should return false when source dataLoader does not have canExpandRow method', () => {
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

      service.addAttributeListSource(source);

      const result = service.canExpandRow('test-source', params);

      expect(result).toBe(false);
    });

    it('should return result from dataLoader canExpandRow when available', () => {
      const params: CanExpandRowParams = {
        applicationId: '1',
        layerId: '1',
      };

      mockApiService.canExpandRow!.mockReturnValue(true);

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: mockApiService,
      };

      service.addAttributeListSource(source);

      const result = service.canExpandRow('test-source', params);

      expect(result).toBe(true);
      expect(mockApiService.canExpandRow).toHaveBeenCalledWith(params);
    });

    it('should return false from dataLoader canExpandRow when it returns false', () => {
      const params: CanExpandRowParams = {
        applicationId: '1',
        layerId: '1',
      };

      mockApiService.canExpandRow!.mockReturnValue(false);

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: mockApiService,
      };

      service.addAttributeListSource(source);

      const result = service.canExpandRow('test-source', params);

      expect(result).toBe(false);
      expect(mockApiService.canExpandRow).toHaveBeenCalledWith(params);
    });
  });

  describe('getFeatureDetails$', () => {
    it('should return null when source is not found', (done) => {
      const params: GetFeatureDetailsParams = {
        applicationId: '1',
        layerId: '1',
        __fid: 'feature-1',
      };

      service.getFeatureDetails$('non-existent-source', params).subscribe(result => {
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

      service.addAttributeListSource(source);

      service.getFeatureDetails$('test-source', params).subscribe(result => {
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

      mockApiService.getFeatureDetails$!.mockReturnValue(of(featureDetails));

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: mockApiService,
      };

      service.addAttributeListSource(source);

      service.getFeatureDetails$('test-source', params).subscribe(result => {
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

      mockApiService.getFeatureDetails$!.mockReturnValue(of(null));

      const source: AttributeListSourceModel = {
        id: 'test-source',
        tabs$: of([]),
        dataLoader: mockApiService,
      };

      service.addAttributeListSource(source);

      service.getFeatureDetails$('test-source', params).subscribe(result => {
        expect(result).toBeNull();
        expect(mockApiService.getFeatureDetails$).toHaveBeenCalledWith(params);
        done();
      });
    });
  });
});
