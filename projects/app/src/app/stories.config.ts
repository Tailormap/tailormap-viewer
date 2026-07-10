import { ApplicationConfig, EnvironmentProviders, provideAppInitializer, inject, Provider } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { LuxonDateAdapter, MAT_LUXON_DATE_FORMATS } from '@angular/material-luxon-adapter';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_CHECKBOX_DEFAULT_OPTIONS } from '@angular/material/checkbox';
import {
  ENVIRONMENT_CONFIG, TailormapApiConstants, TAILORMAP_API_V1_SERVICE, TAILORMAP_SECURITY_API_V1_SERVICE,
  TailormapApiV1Service, TailormapSecurityApiV1Service, AuthenticatedUserService,
} from '@tailormap-viewer/api';
import { ExternalLibsLoaderHelper, ICON_SERVICE_ICON_LOCATION, IconService } from '@tailormap-viewer/shared';
import { environment } from '../environments/environment';

/**
 * Application-level infrastructure providers for a single viewer application (see `mountStoriesViewer`):
 * HttpClient, the API service tokens, config, icon registration, date adapters and animations. Each
 * viewer is bootstrapped as its own Angular application via `createApplication`, so every viewer needs
 * this complete set — it is NOT shared with the host page.
 *
 * These use the standalone provider functions (`provideAnimations`, `provideHttpClient`) rather than
 * `BrowserModule`/`BrowserAnimationsModule`, because `createApplication` already installs the browser
 * platform providers.
 */
export const storiesViewerAppProviders: Array<Provider | EnvironmentProviders> = [
  provideAnimations(),
  provideHttpClient(
    withInterceptorsFromDi(),
    withXsrfConfiguration({
      cookieName: TailormapApiConstants.XSRF_COOKIE_NAME,
      headerName: TailormapApiConstants.XSRF_HEADER_NAME,
    }),
  ),
  { provide: ENVIRONMENT_CONFIG, useValue: { production: environment.production, viewerBaseUrl: environment.viewerBaseUrl } },
  { provide: TAILORMAP_SECURITY_API_V1_SERVICE, useClass: TailormapSecurityApiV1Service },
  { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1Service },
  { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'icons/' },
  { provide: APP_BASE_HREF, useValue: '/' },
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

/**
 * Config for the lightweight stories host page itself (the page that renders the intro text and the
 * three viewer host elements). It intentionally has no NgRx store and no viewer providers — each viewer
 * is its own application, mounted via `mountStoriesViewer`.
 */
export const storiesAppConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
  ],
};
