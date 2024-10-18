import { NgModule } from '@angular/core';
import { IconService } from '@tailormap-viewer/shared';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { PagesModule } from './pages/pages.module';
import { TemplatesModule } from './templates/templates.module';
import { CatalogModule } from './catalog/catalog.module';
import { ApplicationModule } from './application/application.module';
import { OIDCConfigurationModule } from './oidc/oidc-configuration.module';
import { AdminCoreRoutingModule } from './admin-core-routing.module';
import { SettingsModule } from './settings/settings.module';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { SearchIndexModule } from './search-index/search-index.module';

@NgModule({
  imports: [
    AdminCoreRoutingModule,
    PagesModule,
    TemplatesModule,
    CatalogModule,
    ApplicationModule,
    SettingsModule,
    SearchIndexModule,
    OIDCConfigurationModule,
  ],
})
export class AdminCoreModule {
  constructor(
    matIconRegistry: MatIconRegistry,
    domSanitizer: DomSanitizer,
    iconService: IconService,
    authenticatedUserService: AuthenticatedUserService,
  ) {
    const adminIcons = [{
      folder: 'admin',
      icons: [
        'home', 'catalog', 'service', 'user', 'groups', 'feature_source', 'wfs', 'jdbc', 'form',
        'feature_type', 'application', 'more', 'link_new_window', 'default_application', 'search-index',
        'logs',
      ],
    }];
    iconService.loadIconsToIconRegistry(matIconRegistry, domSanitizer, adminIcons);
    authenticatedUserService.fetchUserDetails();
  }
}
