import { NgModule } from '@angular/core';
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

const getBaseHref = (platformLocation: PlatformLocation): string => {
  return platformLocation.getBaseHrefFromDOM();
};

@NgModule({
  imports: [
    StoreModule.forRoot({}, {
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
  ],
  providers: [
    { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'icons/' },
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
    const adminIcons = [{ folder: 'admin', icons: [ 'home', 'catalog', 'service', 'user', 'groups' ] }];
    iconService.loadIconsToIconRegistry(matIconRegistry, domSanitizer);
    iconService.loadIconsToIconRegistry(matIconRegistry, domSanitizer, adminIcons);
  }
}
