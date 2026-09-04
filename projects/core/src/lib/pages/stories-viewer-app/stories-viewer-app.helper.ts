import {
  ApplicationRef, ComponentRef, EnvironmentInjector, EnvironmentProviders, inject,
  provideEnvironmentInitializer, Provider,
  ProviderToken,
} from '@angular/core';
import { createApplication, DomSanitizer } from '@angular/platform-browser';
import { StoriesViewerAppComponent } from './stories-viewer-app.component';
import { VIEWER_ROUTE_SYNC_ENABLED } from '../../viewer-instance/viewer-route-sync.token';
import { VIEWER_ROOT_ELEMENT } from '../../viewer-instance/viewer-root-element.token';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';
import {
  AuthenticatedUserService, ENVIRONMENT_CONFIG, EnvironmentConfigModel,
  TAILORMAP_CROSS_ORIGIN_API_SERVICE, TailormapApiConstants,
} from '@tailormap-viewer/api';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { IconService } from '@tailormap-viewer/shared';
import { MatIconRegistry } from '@angular/material/icon';
import { nanoid } from 'nanoid';
import { UserLoginCheckService } from '../../services/user-login-check.service';
import { ProviderHelper } from '../../viewer-instance/provider.helper';
import { provideAttributeList } from '../../components/attribute-list/attribute-list.providers';
import { provideDrawing } from '../../components/drawing/drawing.providers';
import { provideEdit } from '../../components/edit/edit.providers';
import { provideFeatureInfo } from '../../components/feature-info/feature-info.providers';
import { provideFilterComponent } from '../../components/filter/filter-component.providers';
import { provideToc } from '../../components/toc/toc.providers';

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
export function getRootProviders(
  hostElement: HTMLElement,
  environmentConfig?: EnvironmentConfigModel,
  viewerId?: string,
): Array<Provider | EnvironmentProviders> {
  return [
    provideAnimations(),
    provideHttpClient(
      withInterceptorsFromDi(),
      withXsrfConfiguration({
        cookieName: TailormapApiConstants.XSRF_COOKIE_NAME,
        headerName: TailormapApiConstants.XSRF_HEADER_NAME,
      }),
    ),
    // Same as the main app: only wire up Redux DevTools in non-production builds, each viewer instance
    // gets its own store, so it also gets its own devtools connection (named by viewerId, if provided).
    ...(environmentConfig?.production === false
      ? [provideStoreDevtools({ maxAge: 25, connectInZone: true, name: viewerId ?? nanoid() })]
      : []),
    { provide: ENVIRONMENT_CONFIG, useValue: environmentConfig },
    { provide: VIEWER_ROUTE_SYNC_ENABLED, useValue: false },
    { provide: VIEWER_ROOT_ELEMENT, useValue: hostElement },
    ...ProviderHelper.getBaseProviders(),
    ...provideToc(),
    ...provideDrawing(),
    ...provideEdit(),
    ...provideFeatureInfo(),
    ...provideFilterComponent(),
    ...provideAttributeList(),
    provideEnvironmentInitializer(() => {
      inject(IconService).loadIconsToIconRegistry(inject(MatIconRegistry), inject(DomSanitizer));
      inject(AuthenticatedUserService).fetchUserDetails();
      inject(UserLoginCheckService).pingUserLoggedIn();
      inject(TAILORMAP_CROSS_ORIGIN_API_SERVICE).init();
    }),
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
 * Each feature component's state slice is registered here via its own `provide*()` function (e.g.
 * {@link provideToc}, {@link provideDrawing}), same as the main, single-viewer app (`provideCore()`,
 * which provides its root store via `provideStore()` too, and wires up the same `provide*()` functions).
 * Both roots use the standalone `@ngrx/store` API rather than `StoreModule.forRoot()`/`forFeature()`, so
 * `ROOT_STORE_PROVIDER` is available to every feature slice in either application.
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
  const { hostElement, viewerId, parentInjector } = options;
  const environmentConfig = parentInjector.get(ENVIRONMENT_CONFIG, { production: true, viewerBaseUrl: '/' });
  const applicationRef = await createApplication({
    providers: getRootProviders(hostElement, environmentConfig, viewerId),
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

