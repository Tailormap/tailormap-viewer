import { FeatureInfoService } from './feature-info.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { CoreState, initialCoreState } from '../../state/core.state';
import { getAppLayerModel, getFeaturesResponseModel, TAILORMAP_API_V1_SERVICE } from '@tailormap-viewer/api';
import { of } from 'rxjs';
import { selectApplicationId } from '../../state/core.selectors';
import { selectVisibleLayersWithAttributes } from '../../map/state/map.selectors';
import { TestBed } from '@angular/core/testing';
import { MapService } from '@tailormap-viewer/map';
import { NgZone } from '@angular/core';

describe('FeatureInfoService', () => {

  const appLayer = getAppLayerModel({ visible: true, hasAttributes: true });
  const initialState: CoreState = { ...initialCoreState };
  const response = getFeaturesResponseModel();
  const getFeatures$ = () => of(response);

  let store: MockStore;
  let service: FeatureInfoService;
  const mapService = {
    provide: MapService,
    useValue: {
      getResolution$: () => of({ resolution: 1 }),
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FeatureInfoService,
        mapService,
        provideMockStore({ initialState }),
        { provide: TAILORMAP_API_V1_SERVICE, useValue: { getFeatures$ } },
      ],
    });
    service = TestBed.inject(FeatureInfoService);
    store = TestBed.inject(MockStore);
  });

  test('should get features', done => {
    store.overrideSelector(selectVisibleLayersWithAttributes, [appLayer]);
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
    store.overrideSelector(selectApplicationId, 0);
    expect(service).toBeTruthy();
    service.getFeatures$([ 1, 2 ])
      .subscribe(featureInfo => {
        expect(featureInfo.length).toEqual(0);
        done();
      });
  });

});
