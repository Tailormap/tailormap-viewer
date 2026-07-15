import {
  ApplicationRef, ComponentRef, createComponent, createEnvironmentInjector, EnvironmentInjector, EnvironmentProviders, Provider,
  ProviderToken,
} from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { StoriesViewerAppComponent } from './stories-viewer-app.component';
import { VIEWER_ROUTE_SYNC_ENABLED } from '../../viewer-instance/viewer-route-sync.token';
import { VIEWER_ROOT_ELEMENT } from '../../viewer-instance/viewer-root-element.token';
import { provideState, provideStore } from '@ngrx/store';
import { coreStateKey } from '../../state';
import { coreReducer } from '../../state/core.reducer';
import { mapStateKey } from '../../map/state/map.state';
import { mapReducer } from '../../map/state/map.reducer';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';
import { TailormapApiConstants } from '@tailormap-viewer/api';
import { StoreInstanceProviderHelper } from '../../viewer-instance/store-instance-provider.helper';

/**
 * Providers that give a {@link StoriesViewerAppComponent} its own, isolated NgRx store + effects +
 * feature slices and its own copies of the viewer-scoped services. Delegates to the shared
 * {@link getViewerInstanceProviders}.
 *
 * Also disables {@link VIEWER_ROUTE_SYNC_ENABLED}: this application root never configures any routes
 * (see the token's doc), so `LoadViewerService` must not try to sync the loaded viewer into the URL.
 *
 * And overrides {@link VIEWER_ROOT_ELEMENT} to this viewer's own `hostElement` (instead of the default
 * `document.body`), so services like `DialogService` scope their DOM side effects to this viewer instance
 * rather than clobbering every other viewer mounted on the same page.
 */
export function getRootProviders(hostElement: HTMLElement): Array<Provider | EnvironmentProviders> {
  return [
    provideAnimations(),
    provideHttpClient(
      withInterceptorsFromDi(),
      withXsrfConfiguration({
        cookieName: TailormapApiConstants.XSRF_COOKIE_NAME,
        headerName: TailormapApiConstants.XSRF_HEADER_NAME,
      }),
    ),
    StoreInstanceProviderHelper.getStoreProvider(),
    { provide: VIEWER_ROUTE_SYNC_ENABLED, useValue: false },
    { provide: VIEWER_ROOT_ELEMENT, useValue: hostElement },
  ];
}

export interface MountStoriesViewerOptions {
  hostElement: HTMLElement;
  viewerId?: string;
  parentInjector: EnvironmentInjector;
}

export interface StoriesViewerRef {
  /** The application backing this viewer (its own store, effects, map, ...). */
  applicationRef: ApplicationRef;
  /** The bootstrapped component instance. */
  componentRef: ComponentRef<StoriesViewerAppComponent>;
  /**
   * Resolves any provider from this viewer's own root injector, e.g. `MapService` from
   * `@tailormap-viewer/map` to drive its map, or `Store` to read/dispatch its NgRx state. This is the
   * hook for interacting with a specific viewer instance from outside its component tree (e.g. a button
   * on the host page that zooms one particular viewer to a location).
   */
  getService: <T>(token: ProviderToken<T>) => T;
  /** Tears the viewer down and destroys its application. */
  destroy: () => void;
}

/**
 * Mounts a {@link StoriesViewerAppComponent} into `hostElement` as its **own Angular application**, so
 * multiple viewers can live on one page, each with a fully independent store/map context.
 *
 * The viewer's feature NgModules (imported by {@link StoriesViewerAppComponent} via `LayoutModule`) each
 * register their own state slice via the standalone `provideState()` (in their own `providers` array),
 * same as the main, single-viewer app (`CoreModule`, which provides its root store via `provideStore()`
 * too). Both roots use the standalone `@ngrx/store` API rather than `StoreModule.forRoot()`/
 * `forFeature()`, so `ROOT_STORE_PROVIDER` is available to every feature slice in either application.
 *
 * @example
 * const ref = await mountStoriesViewer({
 *   hostElement: document.getElementById('viewer-1')!,
 *   viewerId: 'app/default',
 *   providers: storiesViewerAppProviders, // HttpClient, API tokens, icons, animations, ...
 * });
 * // later:
 * ref.destroy();
 */
export async function mountStoriesViewer(options: MountStoriesViewerOptions): Promise<StoriesViewerRef> {
  const { hostElement, viewerId } = options;
  const applicationRef = await createApplication({
    providers: getRootProviders(hostElement),
  });
  const componentRef = applicationRef.bootstrap(StoriesViewerAppComponent, hostElement);
  if (viewerId !== undefined) {
    componentRef.setInput('viewerId', viewerId);
  }
  return {
    applicationRef,
    componentRef,
    getService: token => applicationRef.injector.get(token),
    destroy: () => applicationRef.destroy(),
  };
}

export async function renderStoriesViewer(options: MountStoriesViewerOptions): Promise<StoriesViewerRef> {
  const { hostElement, viewerId, parentInjector } = options;
  const injector = createEnvironmentInjector(
    getRootProviders(hostElement),
    parentInjector,
  );
  // Then create the component in that injector context
  const applicationRef = injector.get(ApplicationRef);
  const componentRef = createComponent(StoriesViewerAppComponent, {
    environmentInjector: injector,
    hostElement,
  });
  if (viewerId !== undefined) {
    componentRef.setInput('viewerId', viewerId);
  }
  applicationRef.attachView(componentRef.hostView);
  return {
    applicationRef,
    componentRef,
    getService: token => injector.get(token),
    destroy: () => applicationRef.destroy(),
  };
}
