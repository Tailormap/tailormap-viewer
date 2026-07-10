import { ApplicationRef, ComponentRef, EnvironmentProviders, Provider, ProviderToken } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { StoriesViewerAppComponent } from './stories-viewer-app.component';
import { getViewerInstanceProviders } from '../../viewer-instance/provide-viewer-instance';
import { VIEWER_ROUTE_SYNC_ENABLED } from '../../viewer-instance/viewer-route-sync.token';
import { VIEWER_ROOT_ELEMENT } from '../../viewer-instance/viewer-root-element.token';

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
export function getStoriesViewerStateProviders(hostElement: HTMLElement): Array<Provider | EnvironmentProviders> {
  return [
    ...getViewerInstanceProviders(),
    { provide: VIEWER_ROUTE_SYNC_ENABLED, useValue: false },
    { provide: VIEWER_ROOT_ELEMENT, useValue: hostElement },
  ];
}

export interface MountStoriesViewerOptions {
  /** Element the viewer is rendered into. */
  hostElement: HTMLElement;
  /** Id of the viewer to load, e.g. `app/default`. When omitted the default viewer is loaded. */
  viewerId?: string;
  /**
   * Application-level providers for this viewer's **own** application root: HttpClient, the API service
   * tokens, `ENVIRONMENT_CONFIG`, icon registration, date adapters, animations, ... Every viewer is a
   * separate Angular application (see the note on {@link mountStoriesViewer}), so it needs a complete
   * provider set — it does not inherit anything from the host page.
   */
  providers: Array<Provider | EnvironmentProviders>;
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
 * multiple viewers can live on one page, each with a fully independent store/effects/map context.
 *
 * Why a whole application and not just a child `EnvironmentInjector`: NgRx's effects runner can only be
 * initialised in an application-root injector. Providing effects in a `createEnvironmentInjector` child
 * (or route `providers`) throws while wiring the runner (`NG0201 _Store` / `NG0200 _EffectsRunner`) —
 * see `provide-viewer-instance.spec.ts`. `createApplication` gives each viewer a real root where the
 * store and effects initialise correctly.
 *
 * The viewer's feature NgModules (imported by {@link StoriesViewerAppComponent} via `LayoutModule`) no
 * longer register their state slices themselves (`StoreModule.forFeature` requires a `StoreRootModule`
 * instance, which only `StoreModule.forRoot` provides — not the standalone `provideStore` used here).
 * Every feature slice is registered once, centrally, via `getViewerFeatureStateProviders` in
 * {@link getViewerInstanceProviders} — consumed by both this per-viewer application root and
 * `CoreModule` (the main, single-viewer app).
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
  const { hostElement, viewerId, providers } = options;

  const applicationRef = await createApplication({
    providers: [ ...providers, ...getStoriesViewerStateProviders(hostElement) ],
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
