import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { oidcConfigurationStateKey } from './state/oidc-configuration.state';
import { oidcConfigurationReducer } from './state/oidc-configuration.reducer';
import { StoreModule } from '@ngrx/store';
import { OIDCConfigurationEditSettingsComponent } from './oidc-configuration-edit-settings/oidc-configuration-edit-settings.component';
import { OIDCConfigurationCreateComponent } from './oidc-configuration-create/oidc-configuration-create.component';
import { OIDCConfigurationListComponent } from './oidc-configuration-list/oidc-configuration-list.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { RouterOutlet, Routes } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { OIDCConfigurationEffects } from './state/oidc-configuration.effects';
import { OIDCConfigurationFormComponent } from './oidc-configuration-form/oidc-configuration-form.component';
import { SharedAdminComponentsModule } from '../shared/components/shared-admin-components.module';
import { OIDCConfigurationHomeComponent } from './oidc-configuration-home/oidc-configuration-home.component';
import { OIDCConfigurationEditComponent } from './oidc-configuration-edit/oidc-configuration-edit.component';
import { OIDCConfigurationService } from './services/oidc-configuration.service';
import { OIDCConfigurationPageComponent } from './oidc-configuration/oidc-configuration-page.component';
import { Routes as AdminRoutes } from '../routes';
import { AdminSettingsRouterService } from '../settings/services/admin-settings-router.service';

const routes: Routes = [{
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
}];

@NgModule({
  declarations: [
    OIDCConfigurationPageComponent,
    OIDCConfigurationEditSettingsComponent,
    OIDCConfigurationCreateComponent,
    OIDCConfigurationListComponent,
    OIDCConfigurationFormComponent,
    OIDCConfigurationHomeComponent,
    OIDCConfigurationEditComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(oidcConfigurationStateKey, oidcConfigurationReducer),
    EffectsModule.forFeature([OIDCConfigurationEffects]),
    SharedAdminComponentsModule,
    RouterOutlet,
 ],
  exports: [
    OIDCConfigurationPageComponent,
    OIDCConfigurationListComponent,
  ],
})
export class OIDCConfigurationModule {
  constructor(
    oidcConfigurationService: OIDCConfigurationService,
    adminSettingsRouterService: AdminSettingsRouterService,
  ) {
    oidcConfigurationService.listenForOIDCConfigurationChanges();
    adminSettingsRouterService.registerSettingsRoutes(routes);
  }
}
