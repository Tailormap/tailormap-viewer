import { FeatureInfoService } from './feature-info.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { CoreState, initialCoreState } from '../../state/core.state';
import { getAppLayerModel, getFeaturesResponseModel, getServiceModel, TAILORMAP_API_V1_SERVICE } from '@tailormap-viewer/api';
import { of } from 'rxjs';
import { selectApplicationId } from '../../state/core.selectors';
import { selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes } from '../../map/state/map.selectors';
import { TestBed } from '@angular/core/testing';
import { MapService } from '@tailormap-viewer/map';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';

describe('FeatureInfoService', () => {

  const appLayer = {
    ...getAppLayerModel({ visible: true, hasAttributes: true }),
    service: getServiceModel({ id: 1 }),
    filter: '',
  };
  const response = getFeaturesResponseModel();
  const getFeatures$ = () => of(response);
  const getFeatureInfoForLayers$ = jest.fn(() => of(response.features));

  let store: MockStore;
  let service: FeatureInfoService;
  const mapService = {
    provide: MapService,
    useValue: {
      getResolution$: () => of({ resolution: 1 }),
      getProjectionCode$: () => of('EPSG:4326'),
      getFeatureInfoForLayers$,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FeatureInfoService,
        mapService,
        provideMockStore({ initialState: {} }),
        { provide: TAILORMAP_API_V1_SERVICE, useValue: { getFeatures$ } },
      ],
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(FeatureInfoService);
    store = TestBed.inject(MockStore);
  });

  test('should get features', done => {
    store.overrideSelector(selectVisibleLayersWithAttributes, [appLayer]);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, []);
    store.overrideSelector(selectApplicationId, 1);
    expect(service).toBeTruthy();
    expect(mapService).toBeTruthy();
    service.getFeatures$([ 1, 2 ])
      .subscribe(featureInfo => {
        expect(featureInfo.length).toEqual(1);
        expect(featureInfo[0].features).toEqual(response.features.map(f => ({ ...f, layerId: appLayer.id })));
        expect(featureInfo[0].layerId).toEqual(appLayer.id);
        expect(featureInfo[0].columnMetadata).toEqual(response.columnMetadata.map(m => ({ ...m, layerId: appLayer.id })));
        done();
      });
  });

  test('returns empty array when there are no visible layers', done => {
    store.overrideSelector(selectVisibleLayersWithAttributes, []);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, []);
    store.overrideSelector(selectApplicationId, 1);
    expect(service).toBeTruthy();
    service.getFeatures$([ 1, 2 ])
      .subscribe(featureInfo => {
        expect(featureInfo.length).toBe(0);
        done();
      });
  });

  test('returns empty array when there is no application id', done => {
    store.overrideSelector(selectVisibleLayersWithAttributes, []);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, []);
    store.overrideSelector(selectApplicationId, 0);
    expect(service).toBeTruthy();
    service.getFeatures$([ 1, 2 ])
      .subscribe(featureInfo => {
        expect(featureInfo.length).toEqual(0);
        done();
      });
  });

  test('executes WMS get feature info request for WMS layers', done => {
    const httpClient = TestBed.inject(HttpClient);
    store.overrideSelector(selectVisibleLayersWithAttributes, []);
    store.overrideSelector(selectVisibleWMSLayersWithoutAttributes, [appLayer]);
    store.overrideSelector(selectApplicationId, 1);
    expect(service).toBeTruthy();
    service.getFeatures$([ 1, 2 ])
      .subscribe(featureInfo => {
        expect(featureInfo.length).toEqual(1);
        expect(getFeatureInfoForLayers$).toHaveBeenCalledWith('1', [ 1, 2 ], httpClient);
        done();
      });
  });

});
