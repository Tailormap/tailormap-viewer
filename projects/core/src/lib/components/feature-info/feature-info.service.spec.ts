import { describe, beforeEach, test, expect, vi } from 'vitest';
import { FeatureInfoService } from './feature-info.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  FilterTypeEnum, getAppLayerModel, getFeaturesResponseModel, getServiceModel, HiddenLayerFunctionality, TAILORMAP_API_V1_SERVICE, TailormapApiConstants,
} from '@tailormap-viewer/api';
import { firstValueFrom, of, toArray } from 'rxjs';
import { selectViewerId } from '../../state/core.selectors';
import { selectEnabledFilterGroups } from '../../state/filter-state/filter.selectors';
import { selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes } from '../../map/state/map.selectors';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { getMapServiceMock } from '../../test-helpers/map-service.mock';
import { initialFilterState } from '../../state';
import { DataSourceManagerService } from '../../services/data-source-manager.service';
import { DataSourceLayerModel, DEFAULT_DATA_SOURCE_ID } from '../../models/data-source.model';
import { loadFeatureInfo } from './state/feature-info.actions';

describe('FeatureInfoService', () => {

  const appLayer = {
    ...getAppLayerModel({ visible: true, hasAttributes: true }),
    service: getServiceModel({ id: '1' }),
    filter: '',
  };
  const response = getFeaturesResponseModel();
  const getFeatures$ = vi.fn(() => of(response));
  const getFeatureInfoForLayers$ = vi.fn(() => of(response.features));

  let store: MockStore;
  let service: FeatureInfoService;
  const mapServiceMock = getMapServiceMock(undefined, null, { getFeatureInfoForLayers$ });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withXsrfConfiguration({
            cookieName: TailormapApiConstants.XSRF_COOKIE_NAME,
            headerName: TailormapApiConstants.XSRF_HEADER_NAME,
          }),
        ),
        provideHttpClientTesting(),
        FeatureInfoService,
        mapServiceMock.provider,
        provideMockStore({
          initialState: { core: { filters: initialFilterState }, map: { services: [], layers: [appLayer] } },
        }),
        { provide: TAILORMAP_API_V1_SERVICE, useValue: { getFeatures$ } },
      ],
    });
    service = TestBed.inject(FeatureInfoService);
    store = TestBed.inject(MockStore);
  });

  test('should get features', async () => {
    store.overrideSelector(selectVisibleLayersWithAttributes, [appLayer]);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, []);
    store.overrideSelector(selectViewerId, '1');
    expect(service).toBeTruthy();
    const featureInfo = await firstValueFrom(service.fetchFeatures$([ 1, 2 ], [ 1, 2 ]));
    expect(featureInfo?.features).toEqual(response.features.map(f => ({ ...f, layerId: appLayer.id })));
    expect(featureInfo?.layerId).toEqual(appLayer.id);
    expect(featureInfo?.columnMetadata).toEqual(response.columnMetadata.map(m => ({ ...m, layerId: appLayer.id })));
  });

  test('returns empty array when there are no visible layers', async () => {
    store.overrideSelector(selectVisibleLayersWithAttributes, []);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, []);
    store.overrideSelector(selectViewerId, '1');
    expect(service).toBeTruthy();
    const featureInfo = await firstValueFrom(service.fetchFeatures$([ 1, 2 ], [ 1, 2 ]));
    expect(featureInfo).toBe(null);
  });

  test('returns empty array when there is no application id', async () => {
    store.overrideSelector(selectVisibleLayersWithAttributes, []);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, []);
    store.overrideSelector(selectViewerId, '0');
    expect(service).toBeTruthy();
    const featureInfo = await firstValueFrom(service.fetchFeatures$([ 1, 2 ], [ 1, 2 ]));
    expect(featureInfo).toBe(null);
  });

  test('executes WMS get feature info request for WMS layers', async () => {
    const httpClient = TestBed.inject(HttpClient);
    store.overrideSelector(selectVisibleLayersWithAttributes, []);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, [appLayer]);
    store.overrideSelector(selectViewerId, '1');
    expect(service).toBeTruthy();
    const featureInfo = await firstValueFrom(service.fetchFeatures$([ 1, 2 ], [ 1, 2 ]));
    expect(featureInfo?.layerId).toEqual(appLayer.id);
    expect(getFeatureInfoForLayers$).toHaveBeenCalledWith('1', [ 1, 2 ], httpClient);
  });

  test('does not request features for layers with feature info hidden', async () => {
    const hiddenLayer = { ...appLayer, hiddenFunctionality: [HiddenLayerFunctionality.featureInfo] };
    getFeatures$.mockClear();
    getFeatureInfoForLayers$.mockClear();
    store.overrideSelector(selectVisibleLayersWithAttributes, [hiddenLayer]);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, [hiddenLayer]);
    store.overrideSelector(selectViewerId, '1');
    const featureInfo = await firstValueFrom(service.fetchFeatures$([ 1, 2 ], [ 1, 2 ]));
    expect(featureInfo).toBe(null);
    expect(getFeatures$).not.toHaveBeenCalled();
    expect(getFeatureInfoForLayers$).not.toHaveBeenCalled();
  });

  describe('data source layers', () => {

    const dataSourceLayer: DataSourceLayerModel = {
      id: 'user-layer-1', layerName: 'user-layer-1', title: 'User layer', filterable: true, hasAttributes: true, featureInfo: true,
    };

    const addSources = (layers: DataSourceLayerModel[] = [dataSourceLayer]) => {
      const dataLoader = { getFeatures$: vi.fn(() => of(response)), getLayerDetails$: vi.fn() };
      const defaultLoader = { getFeatures$: vi.fn(() => of(response)), getLayerDetails$: vi.fn() };
      const manager = TestBed.inject(DataSourceManagerService);
      manager.addSource({ id: 'user-layers', availableLayers$: of(layers), dataLoader });
      manager.addSource({ id: DEFAULT_DATA_SOURCE_ID, availableLayers$: of([{ ...dataSourceLayer, id: appLayer.id, featureInfo: false }]), dataLoader: defaultLoader });
      store.overrideSelector(selectVisibleLayersWithAttributes, []);
      store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, []);
      store.overrideSelector(selectViewerId, '1');
      return { dataLoader, defaultLoader };
    };

    test('queries data source layers with featureInfo, but not the default source', async () => {
      const { dataLoader, defaultLoader } = addSources();
      const dispatch = vi.spyOn(store, 'dispatch');
      const featureInfo = await firstValueFrom(service.fetchFeatures$([ 1, 2 ], [ 1, 2 ]).pipe(toArray()));
      expect(featureInfo.map(f => f?.layerId)).toEqual([dataSourceLayer.id]);
      expect(featureInfo[0]?.features).toEqual(response.features.map(f => ({ ...f, layerId: dataSourceLayer.id })));
      expect(dataLoader.getFeatures$).toHaveBeenCalledWith(expect.objectContaining({
        applicationId: '1', layerId: dataSourceLayer.id, layerName: dataSourceLayer.layerName, x: 1, y: 2, distance: 10,
      }));
      expect(defaultLoader.getFeatures$).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: loadFeatureInfo.type,
        layers: [expect.objectContaining({ id: dataSourceLayer.id, title: dataSourceLayer.title })],
      }));
    });

    test('skips data source layers without featureInfo', async () => {
      const { dataLoader } = addSources([{ ...dataSourceLayer, featureInfo: false }]);
      const featureInfo = await firstValueFrom(service.fetchFeatures$([ 1, 2 ], [ 1, 2 ]));
      expect(featureInfo).toBe(null);
      expect(dataLoader.getFeatures$).not.toHaveBeenCalled();
    });

    test('skips data source layers that are hidden or out of scale in map state', async () => {
      const { dataLoader } = addSources([ dataSourceLayer, { ...dataSourceLayer, id: 'out-of-scale' }, { ...dataSourceLayer, id: 'hidden' }]);
      store.setState({
        core: { filters: initialFilterState },
        map: {
          services: [],
          layers: [
            { ...appLayer, id: dataSourceLayer.id, visible: false },
            { ...appLayer, id: 'out-of-scale', visible: true, minScale: 5000 },
            { ...appLayer, id: 'hidden', visible: true, hiddenFunctionality: [HiddenLayerFunctionality.featureInfo] },
          ],
        },
      });
      const featureInfo = await firstValueFrom(service.fetchFeatures$([ 1, 2 ], [ 1, 2 ]));
      expect(featureInfo).toBe(null);
      expect(dataLoader.getFeatures$).not.toHaveBeenCalled();
    });

    test('getFeaturesForLayer$ queries a data source layer with the enabled filter groups', async () => {
      const { dataLoader } = addSources();
      const filterGroups = [{ id: 'g1', layerIds: [dataSourceLayer.id], filters: [], operator: 'AND' as const, type: FilterTypeEnum.ATTRIBUTE, source: 'test' }];
      store.overrideSelector(selectEnabledFilterGroups, filterGroups);
      const featureInfo = await firstValueFrom(service.getFeaturesForLayer$([ 1, 2 ], dataSourceLayer.id));
      expect(featureInfo?.layerId).toEqual(dataSourceLayer.id);
      expect(dataLoader.getFeatures$).toHaveBeenCalledWith(expect.objectContaining({ layerId: dataSourceLayer.id, x: 1, y: 2, filterGroups }));
    });

  });

  test('maps a features response to a feature info response', () => {
    const result = FeatureInfoService.featuresResponseToFeatureInfoResponse({ ...response, attachmentMetadata: undefined }, 'layer-1');
    expect(result).toEqual({
      features: response.features.map(f => ({ ...f, layerId: 'layer-1' })),
      columnMetadata: response.columnMetadata.map(m => ({ ...m, layerId: 'layer-1' })),
      attachmentMetadata: [],
      template: response.template,
      layerId: 'layer-1',
    });
  });

});
