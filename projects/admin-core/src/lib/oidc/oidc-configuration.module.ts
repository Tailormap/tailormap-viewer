import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { oidcConfigurationStateKey } from './state/oidc-configuration.state';
import { oidcConfigurationReducer } from './state/oidc-configuration.reducer';
import { StoreModule } from '@ngrx/store';
import { OIDCConfigurationEditSettingsComponent } from './oidc-configuration-edit-settings/oidc-configuration-edit-settings.component';
import { OIDCConfigurationCreateComponent } from './oidc-configuration-create/oidc-configuration-create.component';
import { OIDCConfigurationListComponent } from './oidc-configuration-list/oidc-configuration-list.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { OIDCConfigurationEffects } from './state/oidc-configuration.effects';
import { OIDCConfigurationFormComponent } from './oidc-configuration-form/oidc-configuration-form.component';
import { SharedAdminComponentsModule } from '../shared/components/shared-admin-components.module';
import { OIDCConfigurationHomeComponent } from './oidc-configuration-home/oidc-configuration-home.component';
import { OIDCConfigurationEditComponent } from './oidc-configuration-edit/oidc-configuration-edit.component';
import { CatalogModule } from '../catalog/catalog.module';
import { OIDCConfigurationService } from './services/oidc-configuration.service';

@NgModule({
  declarations: [
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
    RouterLink,
    SharedAdminComponentsModule,
    RouterOutlet,
    CatalogModule,
    RouterLinkActive,
 ],
  exports: [
    OIDCConfigurationListComponent,
  ],
})
export class OIDCConfigurationModule {
  constructor(oidcConfigurationService: OIDCConfigurationService) {
    oidcConfigurationService.listenForOIDCConfigurationChanges();
  }
}
