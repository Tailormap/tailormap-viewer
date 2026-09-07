import {
  ViewerResponseModel, getViewerResponseData, getComponentModel, TailormapApiV1ServiceModel, TAILORMAP_API_V1_SERVICE,
} from '@tailormap-viewer/api';
import { Observable, of } from 'rxjs';
import { LoadViewerService } from './load-viewer.service';
import { TestBed } from '@angular/core/testing';
import { Store, Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { LoadMapService } from '../map/services/load-map.service';
import { loadViewer, loadViewerFailed, loadViewerSuccess } from '../state/core.actions';
import { addAllFilterGroupsInConfig } from '../state/filter-state/filter.actions';

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

  const setup = (apiOverrides?: Partial<TailormapApiV1ServiceModel>, currentPath = '/') => {
    const navigate = jest.fn();
    const loadMap = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        LoadViewerService,
        { provide: TAILORMAP_API_V1_SERVICE, useValue: getMockApiService(apiOverrides) },
        provideMockStore(),
        { provide: Location, useValue: { path: () => currentPath } },
        { provide: Router, useValue: { navigate } },
        { provide: LoadMapService, useValue: { loadMap } },
      ],
    });
    const service = TestBed.inject(LoadViewerService);
    const store = TestBed.inject(Store);
    const dispatched: Action[] = [];
    jest.spyOn(store, 'dispatch').mockImplementation(action => { dispatched.push(action); });
    return { service, dispatched, navigate, loadMap };
  };

  test('test working flow', () => {
    const { service, dispatched, loadMap } = setup();
    service.loadViewer();
    expect(dispatched).toEqual(expect.arrayContaining([
      loadViewer({ id: undefined }),
      loadViewerSuccess({ viewer: getViewerResponseData() }),
      addAllFilterGroupsInConfig({ filterGroups: [] }),
    ]));
    expect(loadMap).toHaveBeenCalledWith('app/default');
  });

  test('test load application error', () => {
    const { service, dispatched, loadMap } = setup({
      getViewer$: () => getErrorObservable<ViewerResponseModel>(),
    });
    service.loadViewer();
    expect(dispatched).toEqual(expect.arrayContaining([
      loadViewerFailed({ error: 'Could not find or load the requested viewer' }),
    ]));
    expect(loadMap).not.toHaveBeenCalled();
  });

  test('navigates to the loaded viewer path when not already there', () => {
    const { service, navigate } = setup({
      getViewer$: () => of(getViewerResponseData({ id: 'app/test', kind: 'app', name: 'test' })),
    }, '/');
    service.loadViewer('app/test');
    expect(navigate).toHaveBeenCalledWith([ 'app', 'test' ], { preserveFragment: true, skipLocationChange: true });
  });

  test('does not navigate when already at the loaded viewer path', () => {
    const { service, navigate } = setup(undefined, '/app/default');
    service.loadViewer();
    expect(navigate).not.toHaveBeenCalled();
  });

});
