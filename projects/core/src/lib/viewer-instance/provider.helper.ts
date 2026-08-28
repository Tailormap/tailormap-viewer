import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SecurityInterceptor } from '../interceptors/security.interceptor';
import {
  CrossOriginPostMessageApiService,
  TAILORMAP_API_V1_SERVICE, TAILORMAP_CROSS_ORIGIN_API_SERVICE, TAILORMAP_SECURITY_API_V1_SERVICE, TailormapApiV1Service,
  TailormapSecurityApiV1Service,
} from '@tailormap-viewer/api';
import { ICON_SERVICE_ICON_LOCATION } from '@tailormap-viewer/shared';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { LuxonDateAdapter, MAT_LUXON_DATE_FORMATS } from '@angular/material-luxon-adapter';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_CHECKBOX_DEFAULT_OPTIONS } from '@angular/material/checkbox';
import { provideStore } from '@ngrx/store';
import { coreStateKey } from '../state';
import { coreReducer } from '../state/core.reducer';
import { mapStateKey } from '../map/state/map.state';
import { mapReducer } from '../map/state/map.reducer';

export class ProviderHelper {

  public static getBaseHref = (platformLocation: PlatformLocation): string => {
    return platformLocation.getBaseHrefFromDOM();
  };

  public static getStoreProvider() {
    return provideStore({
      [coreStateKey]: coreReducer,
      [mapStateKey]: mapReducer,
    }, {
      runtimeChecks: {
        strictActionImmutability: true,
        strictActionSerializability: true,
        strictActionWithinNgZone: true,
        strictStateImmutability: true,
        strictStateSerializability: true,
        strictActionTypeUniqueness: true,
      },
    });
  }

  public static getBaseProviders = () => [
    ProviderHelper.getStoreProvider(),
    { provide: HTTP_INTERCEPTORS, useClass: SecurityInterceptor, multi: true },
    { provide: TAILORMAP_SECURITY_API_V1_SERVICE, useClass: TailormapSecurityApiV1Service },
    { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1Service },
    { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'icons/' },
    { provide: APP_BASE_HREF, useFactory: ProviderHelper.getBaseHref, deps: [PlatformLocation] },
    { provide: DateAdapter, useClass: LuxonDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_LUXON_DATE_FORMATS },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },
    { provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: { color: 'primary' } },
    { provide: TAILORMAP_CROSS_ORIGIN_API_SERVICE, useClass: CrossOriginPostMessageApiService },
  ];

}
