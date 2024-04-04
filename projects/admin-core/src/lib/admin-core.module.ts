import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { IconService } from '@tailormap-viewer/shared';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { PagesModule } from './pages/pages.module';
import { TemplatesModule } from './templates/templates.module';
import { CatalogModule } from './catalog/catalog.module';
import { ApplicationModule } from './application/application.module';
import { OIDCConfigurationModule } from './oidc/oidc-configuration.module';
import { adminCoreStateKey } from './state/admin-core.state';
import { adminCoreReducer } from './state/admin-core.reducer';
import { AdminCoreRoutingModule } from './admin-core-routing.module';
import { SettingsModule } from './settings/settings.module';

@NgModule({
  imports: [
    AdminCoreRoutingModule,
    StoreModule.forFeature(adminCoreStateKey, adminCoreReducer),
    PagesModule,
    TemplatesModule,
    CatalogModule,
    ApplicationModule,
    SettingsModule,
    OIDCConfigurationModule,
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
        'home', 'catalog', 'service', 'user', 'groups', 'feature_source', 'wfs', 'jdbc', 'form',
        'feature_type', 'application', 'more', 'link_new_window', 'default_application',
      ],
    }];
    iconService.loadIconsToIconRegistry(matIconRegistry, domSanitizer, adminIcons);
  }
}
