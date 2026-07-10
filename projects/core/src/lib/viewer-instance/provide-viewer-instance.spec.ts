import { createEnvironmentInjector, EnvironmentInjector, Injectable, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Actions } from '@ngrx/effects';
import { provideEffects } from '@ngrx/effects';
import { createReducer, provideState, Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { getViewerRootStoreProviders } from './provide-viewer-instance';
import { loadViewerSuccess } from '../state/core.actions';
import { selectViewerTitle } from '../state/core.selectors';
import { ViewerResponseModel } from '@tailormap-viewer/api';

const createViewerInjector = (parent: EnvironmentInjector): EnvironmentInjector =>
  createEnvironmentInjector([getViewerRootStoreProviders()], parent);

const viewerResponse = (title: string): ViewerResponseModel => ({ title } as ViewerResponseModel);

// Stand-in for a viewer feature registered via the standalone store/effects API.
const testFeatureReducer = createReducer({ value: 1 });
@Injectable()
class TestFeatureEffects {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars, @angular-eslint/prefer-inject
  constructor(private _actions$: Actions) {}
}

describe('provideViewerInstance store isolation', () => {

  it('gives each viewer instance its own, independent store', async () => {
    const parent = TestBed.inject(EnvironmentInjector);
    // The viewer store enables strictActionWithinNgZone, so dispatches must run inside NgZone (as they
    // do in the real viewer).
    const zone = TestBed.inject(NgZone);

    const injector1 = createViewerInjector(parent);
    const injector2 = createViewerInjector(parent);

    const store1 = injector1.get(Store);
    const store2 = injector2.get(Store);

    // Two separate store instances, not the same singleton.
    expect(store1).not.toBe(store2);

    // Mutating one store must not leak into the other.
    zone.run(() => store1.dispatch(loadViewerSuccess({ viewer: viewerResponse('Viewer one') })));

    expect(await firstValueFrom(store1.select(selectViewerTitle))).toEqual('Viewer one');
    expect(await firstValueFrom(store2.select(selectViewerTitle))).toBeNull();

    zone.run(() => store2.dispatch(loadViewerSuccess({ viewer: viewerResponse('Viewer two') })));

    // The first store keeps its own value.
    expect(await firstValueFrom(store1.select(selectViewerTitle))).toEqual('Viewer one');
    expect(await firstValueFrom(store2.select(selectViewerTitle))).toEqual('Viewer two');

    injector1.destroy();
    injector2.destroy();
  });

  it('supports the store and feature state in a child environment injector', () => {
    // provideStore + provideState work in a createEnvironmentInjector child: this is what makes a
    // per-instance store possible at all.
    const parent = TestBed.inject(EnvironmentInjector);
    const injector = createEnvironmentInjector([
      getViewerRootStoreProviders(),
      provideState('testFeature', testFeatureReducer),
    ], parent);

    const store = injector.get(Store);
    let featureState: { value: number } | undefined;
    store.select((state: Record<string, { value: number }>) => state['testFeature']).subscribe(v => featureState = v);
    expect(featureState).toEqual({ value: 1 });

    injector.destroy();
  });

  it('documents that NgRx effects can NOT be initialised in a child environment injector', () => {
    // Empirical constraint: the effects runner requires an application-root injector. Providing effects
    // in a createEnvironmentInjector child (as route `providers` do) throws while wiring the runner
    // (NG0201 `_Store`). This is why a viewer that needs its own store AND effects must be a separate
    // application (createApplication / bootstrapApplication), not a child environment injector.
    const parent = TestBed.inject(EnvironmentInjector);
    expect(() => createEnvironmentInjector([
      getViewerRootStoreProviders(),
      provideEffects([TestFeatureEffects]),
    ], parent)).toThrow(/NG0201|_Store/);
  });

});
