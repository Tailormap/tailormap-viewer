import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { FeatureInfoService } from './feature-info.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { CoreState, initialCoreState } from '../../state/core.state';
import { getAppLayerModel, getFeaturesResponseModel, getServiceModel, TAILORMAP_API_V1_SERVICE } from '@tailormap-viewer/api';
import { of } from 'rxjs';
import { selectApplicationId, selectVisibleLayers } from '../../state/core.selectors';

describe('FeatureInfoService', () => {

  const appLayer = getAppLayerModel({ visible: true });
  const service = getServiceModel();
  const initialState: CoreState = { ...initialCoreState };
  const response = getFeaturesResponseModel();
  const getFeatures$ = () => of(response);
  let spectator: SpectatorService<FeatureInfoService>;
  let store: MockStore;

  const createService = createServiceFactory({
    service: FeatureInfoService,
    providers: [
      provideMockStore({initialState}),
      { provide: TAILORMAP_API_V1_SERVICE, useValue: { getFeatures$ }},
    ],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  test('should get features', done => {
    store.overrideSelector(selectVisibleLayers, [{
      layer: appLayer,
      service,
    }]);
    store.overrideSelector(selectApplicationId, 1);
    expect(spectator.service).toBeTruthy();
    spectator.service.getFeatures$([1, 2])
      .subscribe(featureInfo => {
        expect(featureInfo.length).toEqual(1);
        expect(featureInfo[0].features).toEqual(response.features.map(f => ({ ...f, layerId: appLayer.id })));
        expect(featureInfo[0].layerId).toEqual(appLayer.id);
        expect(featureInfo[0].columnMetadata).toEqual(response.columnMetadata.map(m => ({ ...m, layerId: appLayer.id })));
        done();
      });
  });

  test('returns empty array when there are no visible layers', done => {
    store.overrideSelector(selectVisibleLayers, []);
    store.overrideSelector(selectApplicationId, 1);
    expect(spectator.service).toBeTruthy();
    spectator.service.getFeatures$([1, 2])
      .subscribe(featureInfo => {
        expect(featureInfo.length).toEqual(0);
        done();
      });
  });

  test('returns empty array when there are no application id', done => {
    store.overrideSelector(selectVisibleLayers, []);
    store.overrideSelector(selectApplicationId, undefined);
    expect(spectator.service).toBeTruthy();
    spectator.service.getFeatures$([1, 2])
      .subscribe(featureInfo => {
        expect(featureInfo.length).toEqual(0);
        done();
      });
  });

});
