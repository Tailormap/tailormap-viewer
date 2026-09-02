import { EnvironmentProviders, importProvidersFrom, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { IconService } from '@tailormap-viewer/shared';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { PagesModule } from './pages/pages.module';
import { CatalogModule } from './catalog/catalog.module';
import { ApplicationModule } from './application/application.module';
import { OIDCConfigurationModule } from './oidc/oidc-configuration.module';
import { SettingsModule } from './settings/settings.module';
import { SearchIndexModule } from './search-index/search-index.module';

export function provideAdminCore(): Array<Provider | EnvironmentProviders> {
  return [
    // These feature areas are still NgModule-based; bridge them in until they're migrated to their own
    // provide*() functions.
    importProvidersFrom(PagesModule, CatalogModule, ApplicationModule, SettingsModule, SearchIndexModule, OIDCConfigurationModule),
    provideEnvironmentInitializer(() => {
      const matIconRegistry = inject(MatIconRegistry);
      const domSanitizer = inject(DomSanitizer);
      const iconService = inject(IconService);
      const authenticatedUserService = inject(AuthenticatedUserService);

      const adminIcons = [{
        folder: 'admin',
        icons: [
          'home', 'catalog', 'service', 'user', 'groups', 'feature_source', 'wfs', 'jdbc', 'form',
          'feature_type', 'application', 'more', 'link_new_window', 'default_application', 'search-index',
          'logs', 'tasks', 'task_successful', 'task_failed', 'task_running', 'warning', 'terrain', 'unavailable', 'expanded', 'collapsed',
        ],
      }, {
        folder: 'admin/filters',
        icons: [ 'filter', 'checkbox', 'date_picker', 'slider', 'toggle', 'dropdown', 'text' ],
      }];
      iconService.loadIconsToIconRegistry(matIconRegistry, domSanitizer, adminIcons);
      authenticatedUserService.fetchUserDetails();
    }),
  ];
}
