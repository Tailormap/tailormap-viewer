import { AppResponseModel, getAppResponseData, getComponentModel, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { Observable, of } from 'rxjs';
import { LoadApplicationService } from './load-application.service';

const getErrorObservable = <T>() => {
  return new Observable<T>(observer => {
    observer.error(new Error('kaboom!'));
    observer.complete();
  });
};

export const getMockApiService = (overrides?: Partial<TailormapApiV1ServiceModel>) => {
  return {
    getApplication$: (params: { name?: string; version?: string; id?: number }) => of(getAppResponseData(params)),
    getComponents$: () => of([getComponentModel()]),
    ...overrides,
  } as TailormapApiV1ServiceModel;
};

describe('LoadApplicationService', () => {

  test('test working flow', done => {
    const service = new LoadApplicationService(getMockApiService());
    service.loadApplication$().subscribe(result => {
      expect(result.success).toEqual(true);
      expect(result.error).toBeUndefined();
      expect(result.result?.application.id).toEqual(1);
      expect(result.result?.application.components.length).toEqual(0);
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

});
