import { ModuleWithProviders, NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { ICON_SERVICE_ICON_LOCATION, IconService } from '@tailormap-viewer/shared';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { LuxonDateAdapter, MAT_LUXON_DATE_FORMATS } from '@angular/material-luxon-adapter';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_CHECKBOX_DEFAULT_OPTIONS } from '@angular/material/checkbox';
import { PagesModule } from './pages/pages.module';
import { TemplatesModule } from './templates/templates.module';
import { CatalogModule } from './catalog/catalog.module';
import { TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { ApplicationModule } from './application/application.module';
import { TAILORMAP_SECURITY_API_V1_SERVICE, TailormapSecurityApiV1Service } from '@tailormap-viewer/api';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SecurityInterceptor } from './interceptors/security.interceptor';
import { adminCoreStateKey } from './state/admin-core.state';
import { adminCoreReducer } from './state/admin-core.reducer';
import { AdminCoreConfigModel } from './models/admin-core-config.model';
import { ADMIN_CORE_CONFIG } from './models/admin-core-config.injection-token';

const getBaseHref = (platformLocation: PlatformLocation): string => {
  return platformLocation.getBaseHrefFromDOM();
};

@NgModule({
  imports: [
    StoreModule.forRoot({
      [adminCoreStateKey]: adminCoreReducer,
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
    EffectsModule.forRoot([]),
    PagesModule,
    TemplatesModule,
    CatalogModule,
    ApplicationModule,
  ],
  providers: [
    { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'icons/' },
    { provide: HTTP_INTERCEPTORS, useClass: SecurityInterceptor, multi: true },
    { provide: TAILORMAP_SECURITY_API_V1_SERVICE, useClass: TailormapSecurityApiV1Service },
    { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useClass: TailormapAdminApiV1Service },
    { provide: APP_BASE_HREF, useFactory: getBaseHref, deps: [PlatformLocation] },
    { provide: DateAdapter, useClass: LuxonDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_LUXON_DATE_FORMATS },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },
    { provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: { color: 'primary' } },
  ],
})
export class AdminCoreModule {
  constructor(
    matIconRegistry: MatIconRegistry,
    domSanitizer: DomSanitizer,
    iconService: IconService,
  ) {
    const adminIcons = [{
      folder: 'admin',
      icons: [
        'home', 'catalog', 'service', 'user', 'groups', 'feature_source',
        'feature_type', 'application', 'more', 'link_new_window', 'default_application',
      ],
    }];
    iconService.loadIconsToIconRegistry(matIconRegistry, domSanitizer);
    iconService.loadIconsToIconRegistry(matIconRegistry, domSanitizer, adminIcons);
  }

  public static forRoot(config: AdminCoreConfigModel): ModuleWithProviders<AdminCoreModule> {
    return {
      ngModule: AdminCoreModule,
      providers: [
        {
          provide: ADMIN_CORE_CONFIG,
          useValue: config,
        },
      ],
    };
  }

}
