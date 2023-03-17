import { ViewerResponseModel, getViewerResponseData, getComponentModel, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { Observable, of } from 'rxjs';
import { LoadViewerService } from './load-viewer.service';

const getErrorObservable = <T>() => {
  return new Observable<T>(observer => {
    observer.error(new Error('kaboom!'));
    observer.complete();
  });
};

export const getMockApiService = (overrides?: Partial<TailormapApiV1ServiceModel>) => {
  return {
    getViewer$: (id?: string) => of(getViewerResponseData(id ? { id } : {})),
    getComponents$: () => of([getComponentModel()]),
    ...overrides,
  } as TailormapApiV1ServiceModel;
};

describe('LoadViewerService', () => {

  test('test working flow', done => {
    const service = new LoadViewerService(getMockApiService());
    service.loadViewer$().subscribe(result => {
      expect(result.success).toEqual(true);
      expect(result.error).toBeUndefined();
      expect(result.result?.viewer.id).toEqual('app/default');
      expect(result.result?.viewer.kind).toEqual('app');
      expect(result.result?.viewer.name).toEqual('default');
      expect(result.result?.viewer.components.length).toEqual(0);
      done();
    });
  });

  test('test load application error', done => {
    const service = new LoadViewerService(getMockApiService({
      getViewer$: () => getErrorObservable<ViewerResponseModel>(),
    }));
    service.loadViewer$().subscribe(result => {
      expect(result.success).toEqual(false);
      expect(result.error).toEqual('Could not find or load the requested viewer');
      expect(result.result).toBeUndefined();
      done();
    });
  });

});
