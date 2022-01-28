import { AppLayerModel, AppResponseModel, ComponentModel, getMockApiService, MapResponseModel } from '@tailormap-viewer/api';
import { Observable } from 'rxjs';
import { LoadApplicationService } from './load-application.service';

const getErrorObservable = <T>() => {
  return new Observable<T>(observer => {
    observer.error(new Error('kaboom!'));
    observer.complete();
  });
};

describe('LoadApplicationService', () => {

  test('test working flow', done => {
    const service = new LoadApplicationService(getMockApiService());
    service.loadApplication$().subscribe(result => {
      expect(result.success).toEqual(true);
      expect(result.error).toBeUndefined();
      expect(result.result?.application.id).toEqual(1);
      expect(result.result?.layers.length).toEqual(2);
      expect(result.result?.components.length).toEqual(1);
      done();
    });
  });

  test('test load application error', done => {
    const service = new LoadApplicationService(getMockApiService({
      getApplication$: () => getErrorObservable<AppResponseModel>(),
    }));
    service.loadApplication$().subscribe(result => {
      expect(result.success).toEqual(false);
      expect(result.error).toEqual('Could not find or load the requested application');
      expect(result.result).toBeUndefined();
      done();
    });
  });

  test('test load map error', done => {
    const service = new LoadApplicationService(getMockApiService({
      getMap$: () => getErrorObservable<MapResponseModel>(),
    }));
    service.loadApplication$().subscribe(result => {
      expect(result.success).toEqual(false);
      expect(result.error).toEqual('Could not load map settings');
      expect(result.result).toBeUndefined();
      done();
    });
  });

  test('test load components error', done => {
    const service = new LoadApplicationService(getMockApiService({
      getComponents$: () => getErrorObservable<ComponentModel[]>(),
    }));
    service.loadApplication$().subscribe(result => {
      expect(result.success).toEqual(false);
      expect(result.error).toEqual('Could not load list of components');
      expect(result.result).toBeUndefined();
      done();
    });
  });

  test('test load layers error', done => {
    const service = new LoadApplicationService(getMockApiService({
      getLayers$: () => getErrorObservable<AppLayerModel[]>(),
    }));
    service.loadApplication$().subscribe(result => {
      expect(result.success).toEqual(false);
      expect(result.error).toEqual('Could not load list of layers');
      expect(result.result).toBeUndefined();
      done();
    });
  });

});
