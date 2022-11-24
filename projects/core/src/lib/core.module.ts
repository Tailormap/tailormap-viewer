import { APP_INITIALIZER, InjectionToken, NgModule } from '@angular/core';
import { ViewerAppComponent } from './pages';
import { MapModule } from '@tailormap-viewer/map';
import { StoreModule } from '@ngrx/store';
import { StoreRouterConnectingModule, routerReducer } from '@ngrx/router-store';
import { EffectsModule } from '@ngrx/effects';
import { coreReducer } from './state/core.reducer';
import { coreStateKey } from './state/core.state';
import { bookmarkReducer } from  './bookmark/bookmark.reducer';
import { bookmarkStateKey } from './bookmark/bookmark.state';
import { CoreEffects } from './state/core.effects';
import { BookmarkEffects } from './bookmark/bookmark.effects';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1Service } from '@tailormap-viewer/api';
import { ICON_SERVICE_ICON_LOCATION, IconService, SharedModule } from '@tailormap-viewer/shared';
import { ComponentsModule } from './components/components.module';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { LoginComponent } from './pages/login/login.component';
import { LoginFormComponent } from './pages/login/login-form/login-form.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SecurityInterceptor } from './interceptors/security.interceptor';
import { ApplicationMapModule } from './map/application-map.module';
import { FilterModule } from './filter/filter.module';
import { Router } from '@angular/router';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { LuxonDateAdapter, MAT_LUXON_DATE_FORMATS } from '@angular/material-luxon-adapter';
import { LayoutModule } from './layout/layout.module';

const getBaseHref = (platformLocation: PlatformLocation): string => {
  return platformLocation.getBaseHrefFromDOM();
};

const TRACE_SERVICE = new InjectionToken('SENTRY_TRACE_SERVICE');
const SENTRY_DSN: string = (window as any).SENTRY_DSN;
const sentryTraceServiceFactory = async (router: Router) => {
  const sentry = await import('@sentry/angular');
  return new sentry.TraceService(router);
};
const sentryProviders = SENTRY_DSN === '@SENTRY_DSN@' ? [] : [
  { provide: TRACE_SERVICE, useFactory: sentryTraceServiceFactory, deps: [Router] },
  { provide: APP_INITIALIZER, useFactory: () => () => {}, deps: [TRACE_SERVICE], multi: true },
];

@NgModule({
  declarations: [
    ViewerAppComponent,
    LoginComponent,
    LoginFormComponent,
  ],
  imports: [
    StoreModule.forRoot({
      [coreStateKey]: coreReducer,
      [bookmarkStateKey]: bookmarkReducer,
      router: routerReducer,
    }, {
      runtimeChecks: {
        strictActionImmutability: true,
        strictActionSerializability: true,
        strictActionWithinNgZone: true,
        strictStateImmutability: true,
        strictStateSerializability: true,
        strictActionTypeUniqueness: true,
      },
    }),
    StoreRouterConnectingModule.forRoot(),
    EffectsModule.forRoot([ CoreEffects, BookmarkEffects ]),
    ApplicationMapModule,
    MapModule,
    FilterModule,
    SharedModule,
    ComponentsModule,
    LayoutModule,
  ],
  exports: [
    ViewerAppComponent,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: SecurityInterceptor, multi: true },
    { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1Service },
    { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'assets/core/imgs/' },
    { provide: APP_BASE_HREF, useFactory: getBaseHref, deps: [PlatformLocation] },
    { provide: DateAdapter, useClass: LuxonDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_LUXON_DATE_FORMATS },
    ...sentryProviders,
  ],
})
export class CoreModule {
  constructor(
    matIconRegistry: MatIconRegistry,
    domSanitizer: DomSanitizer,
    iconService: IconService,
  ) {
    iconService.loadIconsToIconRegistry(matIconRegistry, domSanitizer);
  }
}
