import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { provideState } from '@ngrx/store';
import { oidcConfigurationStateKey } from './state/oidc-configuration.state';
import { oidcConfigurationReducer } from './state/oidc-configuration.reducer';
import { OIDCConfigurationService } from './services/oidc-configuration.service';
import { OIDCConfigurationPageComponent } from './oidc-configuration/oidc-configuration-page.component';
import { OIDCConfigurationHomeComponent } from './oidc-configuration-home/oidc-configuration-home.component';
import { OIDCConfigurationCreateComponent } from './oidc-configuration-create/oidc-configuration-create.component';
import { OIDCConfigurationEditComponent } from './oidc-configuration-edit/oidc-configuration-edit.component';
import { AdminSettingsRouterService } from '../settings/services/admin-settings-router.service';
import { Routes as AdminRoutes } from '../routes';

export function provideOIDCConfiguration(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(oidcConfigurationStateKey, oidcConfigurationReducer),
    provideEnvironmentInitializer(() => {
      inject(OIDCConfigurationService).listenForOIDCConfigurationChanges();
      inject(AdminSettingsRouterService).registerSettingsRoutes($localize `:@@admin-core.navigation.single-sign-on:Single sign-on`, {
        path: AdminRoutes.OIDC_CONFIGURATION,
        component: OIDCConfigurationPageComponent,
        children: [
          {
            path: '',
            component: OIDCConfigurationHomeComponent,
          },
          {
            path: AdminRoutes.OIDC_CONFIGURATION_CREATE,
            component: OIDCConfigurationCreateComponent,
          },
          {
            path: AdminRoutes.OIDC_CONFIGURATION_DETAILS,
            component: OIDCConfigurationEditComponent,
          },
        ],
      });
    }),
  ];
}
