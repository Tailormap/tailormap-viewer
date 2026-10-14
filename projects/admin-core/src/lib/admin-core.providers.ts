import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { IconService } from '@tailormap-viewer/shared';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { provideCatalog } from './catalog/catalog.providers';
import { provideUser } from './user/user.providers';
import { provideForm } from './form/form.providers';
import { provideApplication } from './application/application.providers';
import { provideSearchIndex } from './search-index/search-index.providers';
import { provideTasks } from './tasks/tasks.providers';
import { provideOIDCConfiguration } from './oidc/oidc-configuration.providers';

export function provideAdminCore(): Array<Provider | EnvironmentProviders> {
  return [
    ...provideCatalog(),
    ...provideUser(),
    ...provideForm(),
    ...provideApplication(),
    ...provideSearchIndex(),
    ...provideTasks(),
    ...provideOIDCConfiguration(),
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
