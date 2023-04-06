import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { applicationStateKey } from './state/application.state';
import { applicationReducer } from './state/application.reducer';
import { StoreModule } from '@ngrx/store';
import { ApplicationEditSettingsComponent } from './application-edit-settings/application-edit-settings.component';
import { ApplicationCreateComponent } from './application-create/application-create.component';
import { ApplicationListComponent } from './application-list/application-list.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { RouterLink, RouterOutlet } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { ApplicationEffects } from './state/application.effects';
import { ApplicationFormComponent } from './application-form/application-form.component';
import { SharedAdminComponentsModule } from '../shared/components/shared-admin-components.module';
import { ApplicationHomeComponent } from './application-home/application-home.component';
import { ApplicationEditComponent } from './application-edit/application-edit.component';
import { ApplicationEditLayersComponent } from './application-edit-layers/application-edit-layers.component';
import { ApplicationEditBaseLayersComponent } from './application-edit-base-layers/application-edit-base-layers.component';
import { CatalogModule } from '../catalog/catalog.module';
import { ApplicationLayerTreeComponent } from './application-layer-tree/application-layer-tree.component';



@NgModule({
  declarations: [
    ApplicationEditSettingsComponent,
    ApplicationCreateComponent,
    ApplicationListComponent,
    ApplicationFormComponent,
    ApplicationHomeComponent,
    ApplicationEditComponent,
    ApplicationEditLayersComponent,
    ApplicationEditBaseLayersComponent,
    ApplicationLayerTreeComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(applicationStateKey, applicationReducer),
    EffectsModule.forFeature([ApplicationEffects]),
    RouterLink,
    SharedAdminComponentsModule,
    RouterOutlet,
    CatalogModule,
  ],
  exports: [
    ApplicationListComponent,
  ],
})
export class ApplicationModule { }
