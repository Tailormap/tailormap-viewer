import { NgModule, inject, provideEnvironmentInitializer } from '@angular/core';
import { CommonModule } from '@angular/common';
import { oidcConfigurationStateKey } from './state/oidc-configuration.state';
import { oidcConfigurationReducer } from './state/oidc-configuration.reducer';
import { provideState } from '@ngrx/store';
import { OIDCConfigurationEditSettingsComponent } from './oidc-configuration-edit-settings/oidc-configuration-edit-settings.component';
import { OIDCConfigurationCreateComponent } from './oidc-configuration-create/oidc-configuration-create.component';
import { OIDCConfigurationListComponent } from './oidc-configuration-list/oidc-configuration-list.component';

import { RouterOutlet } from '@angular/router';
import { OIDCConfigurationFormComponent } from './oidc-configuration-form/oidc-configuration-form.component';

import { OIDCConfigurationHomeComponent } from './oidc-configuration-home/oidc-configuration-home.component';
import { OIDCConfigurationEditComponent } from './oidc-configuration-edit/oidc-configuration-edit.component';
import { OIDCConfigurationService } from './services/oidc-configuration.service';
import { OIDCConfigurationPageComponent } from './oidc-configuration/oidc-configuration-page.component';
import { AdminSettingsRouterService } from '../settings/services/admin-settings-router.service';
import { Routes as AdminRoutes } from '../routes';

@NgModule({
    imports: [
    CommonModule,
    RouterOutlet,
    OIDCConfigurationPageComponent,
    OIDCConfigurationEditSettingsComponent,
    OIDCConfigurationCreateComponent,
    OIDCConfigurationListComponent,
    OIDCConfigurationFormComponent,
    OIDCConfigurationHomeComponent,
    OIDCConfigurationEditComponent,
],
    exports: [
        OIDCConfigurationPageComponent,
        OIDCConfigurationListComponent,
    ],
    providers: [
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
    ],
})
export class OIDCConfigurationModule {
}
