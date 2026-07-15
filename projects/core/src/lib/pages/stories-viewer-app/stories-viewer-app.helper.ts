import {
  ApplicationRef, ComponentRef, EnvironmentInjector, EnvironmentProviders, inject,
  provideAppInitializer, Provider,
  ProviderToken,
} from '@angular/core';
import { createApplication, DomSanitizer } from '@angular/platform-browser';
import { StoriesViewerAppComponent } from './stories-viewer-app.component';
import { VIEWER_ROUTE_SYNC_ENABLED } from '../../viewer-instance/viewer-route-sync.token';
import { VIEWER_ROOT_ELEMENT } from '../../viewer-instance/viewer-root-element.token';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';
import {
  AuthenticatedUserService, ENVIRONMENT_CONFIG,
  TAILORMAP_API_V1_SERVICE, TAILORMAP_SECURITY_API_V1_SERVICE, TailormapApiConstants, TailormapApiV1Service, TailormapSecurityApiV1Service,
} from '@tailormap-viewer/api';
import { StoreInstanceProviderHelper } from '../../viewer-instance/store-instance-provider.helper';
import { SecurityInterceptor } from '../../interceptors/security.interceptor';
import { ExternalLibsLoaderHelper, ICON_SERVICE_ICON_LOCATION, IconService } from '@tailormap-viewer/shared';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { LuxonDateAdapter, MAT_LUXON_DATE_FORMATS } from '@angular/material-luxon-adapter';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_CHECKBOX_DEFAULT_OPTIONS } from '@angular/material/checkbox';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter } from '@angular/router';
import { StoriesDemoComponent } from '../stories-demo/stories-demo.component';

const getBaseHref = (platformLocation: PlatformLocation): string => {
  return platformLocation.getBaseHrefFromDOM();
};

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
export function getRootProviders(hostElement: HTMLElement, environmentConfig?: any): Array<Provider | EnvironmentProviders> {
  return [
    provideAnimations(),
    provideHttpClient(
      withInterceptorsFromDi(),
      withXsrfConfiguration({
        cookieName: TailormapApiConstants.XSRF_COOKIE_NAME,
        headerName: TailormapApiConstants.XSRF_HEADER_NAME,
      }),
    ),
    // provideRouter([{ path: 'stories', component: StoriesDemoComponent }]),
    StoreInstanceProviderHelper.getStoreProvider(),
    { provide: ENVIRONMENT_CONFIG, useValue: environmentConfig },
    { provide: VIEWER_ROUTE_SYNC_ENABLED, useValue: false },
    { provide: VIEWER_ROOT_ELEMENT, useValue: hostElement },
    { provide: HTTP_INTERCEPTORS, useClass: SecurityInterceptor, multi: true },
    { provide: TAILORMAP_SECURITY_API_V1_SERVICE, useClass: TailormapSecurityApiV1Service },
    { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1Service },
    { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'icons/' },
    { provide: APP_BASE_HREF, useFactory: getBaseHref, deps: [PlatformLocation] },
    { provide: DateAdapter, useClass: LuxonDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_LUXON_DATE_FORMATS },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },
    { provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: { color: 'primary' } },
    provideAppInitializer(() => {
      inject(IconService).loadIconsToIconRegistry(inject(MatIconRegistry), inject(DomSanitizer));
      ExternalLibsLoaderHelper.setBaseHref(inject(APP_BASE_HREF));
      inject(AuthenticatedUserService).fetchUserDetails();
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
  const { hostElement, viewerId, parentInjector } = options;
  const environmentConfig = parentInjector.get(ENVIRONMENT_CONFIG, { production: true, viewerBaseUrl: '/' });
  console.log('ENVIRONMENT_CONFIG', environmentConfig);
  const applicationRef = await createApplication({
    providers: getRootProviders(hostElement, environmentConfig),
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

