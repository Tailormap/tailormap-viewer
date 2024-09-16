import { FeatureInfoService } from './feature-info.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  getAppLayerModel, getFeaturesResponseModel, getServiceModel, TAILORMAP_API_V1_SERVICE, TailormapApiConstants,
} from '@tailormap-viewer/api';
import { of } from 'rxjs';
import { selectViewerId } from '../../state/core.selectors';
import { selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes } from '../../map/state/map.selectors';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { getMapServiceMock } from '../../test-helpers/map-service.mock.spec';

describe('FeatureInfoService', () => {

  const appLayer = {
    ...getAppLayerModel({ visible: true, hasAttributes: true }),
    service: getServiceModel({ id: '1' }),
    filter: '',
  };
  const response = getFeaturesResponseModel();
  const getFeatures$ = () => of(response);
  const getFeatureInfoForLayers$ = jest.fn(() => of(response.features));

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
        provideMockStore({ initialState: {} }),
        { provide: TAILORMAP_API_V1_SERVICE, useValue: { getFeatures$ } },
      ],
    });
    service = TestBed.inject(FeatureInfoService);
    store = TestBed.inject(MockStore);
  });

  test('should get features', done => {
    store.overrideSelector(selectVisibleLayersWithAttributes, [appLayer]);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, []);
    store.overrideSelector(selectViewerId, '1');
    expect(service).toBeTruthy();
    service.fetchFeatures$([ 1, 2 ], [ 1, 2 ])
      .subscribe(featureInfo => {
        expect(featureInfo?.features).toEqual(response.features.map(f => ({ ...f, layerId: appLayer.id })));
        expect(featureInfo?.layerId).toEqual(appLayer.id);
        expect(featureInfo?.columnMetadata).toEqual(response.columnMetadata.map(m => ({ ...m, layerId: appLayer.id })));
        done();
      });
  });

  test('returns empty array when there are no visible layers', done => {
    store.overrideSelector(selectVisibleLayersWithAttributes, []);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, []);
    store.overrideSelector(selectViewerId, '1');
    expect(service).toBeTruthy();
    service.fetchFeatures$([ 1, 2 ], [ 1, 2 ])
      .subscribe(featureInfo => {
        expect(featureInfo).toBe(null);
        done();
      });
  });

  test('returns empty array when there is no application id', done => {
    store.overrideSelector(selectVisibleLayersWithAttributes, []);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, []);
    store.overrideSelector(selectViewerId, '0');
    expect(service).toBeTruthy();
    service.fetchFeatures$([ 1, 2 ], [ 1, 2 ])
      .subscribe(featureInfo => {
        expect(featureInfo).toBe(null);
        done();
      });
  });

  test('executes WMS get feature info request for WMS layers', done => {
    const httpClient = TestBed.inject(HttpClient);
    store.overrideSelector(selectVisibleLayersWithAttributes, []);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, [appLayer]);
    store.overrideSelector(selectViewerId, '1');
    expect(service).toBeTruthy();
    service.fetchFeatures$([ 1, 2 ], [ 1, 2 ])
      .subscribe(featureInfo => {
        expect(featureInfo?.layerId).toEqual(appLayer.id);
        expect(getFeatureInfoForLayers$).toHaveBeenCalledWith('1', [ 1, 2 ], httpClient);
        done();
      });
  });

});
