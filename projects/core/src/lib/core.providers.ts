import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthenticatedUserService, ENVIRONMENT_CONFIG, EnvironmentConfigModel, TAILORMAP_CROSS_ORIGIN_API_SERVICE } from '@tailormap-viewer/api';
import { ExternalLibsLoaderHelper, IconService, RouterHistoryService } from '@tailormap-viewer/shared';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { coreRoutes } from './core.routes';
import { ApplicationStyleService } from './services/application-style.service';
import { NavigationErrorRouterService } from './services/navigation-error-router.service';
import { UserLoginCheckService } from './services/user-login-check.service';
import { ProviderHelper } from './viewer-instance/provider.helper';
import { provideApplicationMap } from './map/application-map.providers';
import { provideFilter } from './filter/filter.providers';
import { provideAttributeList } from './components/attribute-list/attribute-list.providers';
import { provideDrawing } from './components/drawing/drawing.providers';
import { provideEdit } from './components/edit/edit.providers';
import { provideFeatureInfo } from './components/feature-info/feature-info.providers';
import { provideFilterComponent } from './components/filter/filter-component.providers';
import { provideToc } from './components/toc/toc.providers';

export function provideCore(config: EnvironmentConfigModel): Array<Provider | EnvironmentProviders> {
  return [
    { provide: ENVIRONMENT_CONFIG, useValue: config },
    provideRouter(coreRoutes),
    ...provideApplicationMap(),
    ...provideFilter(),
    ...ProviderHelper.getBaseProviders(),
    ...provideToc(),
    ...provideDrawing(),
    ...provideEdit(),
    ...provideFeatureInfo(),
    ...provideFilterComponent(),
    ...provideAttributeList(),
    provideEnvironmentInitializer(() => {
      inject(ApplicationStyleService).init();
      inject(RouterHistoryService).init();
      inject(IconService).loadIconsToIconRegistry(inject(MatIconRegistry), inject(DomSanitizer));
      ExternalLibsLoaderHelper.setBaseHref(inject(APP_BASE_HREF));
      inject(AuthenticatedUserService).fetchUserDetails();
      inject(UserLoginCheckService).pingUserLoggedIn();
      inject(TAILORMAP_CROSS_ORIGIN_API_SERVICE).init();
      inject(NavigationErrorRouterService).init();
    }),
  ];
}
