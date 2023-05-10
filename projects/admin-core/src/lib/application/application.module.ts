import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { applicationStateKey } from './state/application.state';
import { applicationReducer } from './state/application.reducer';
import { StoreModule } from '@ngrx/store';
import { ApplicationEditSettingsComponent } from './application-edit-settings/application-edit-settings.component';
import { ApplicationCreateComponent } from './application-create/application-create.component';
import { ApplicationListComponent } from './application-list/application-list.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
import { ApplicationCatalogTreeComponent } from './application-catalog-tree/application-catalog-tree.component';
import {
  ApplicationLayerTreeNodeComponent,
} from './application-layer-tree/application-layer-tree-node/application-layer-tree-node.component';
import { ApplicationFolderNodeNameComponent } from './application-layer-tree/application-folder-node-name/application-folder-node-name.component';
import { ApplicationEditComponentsComponent } from './application-edit-components/application-edit-components.component';
import { ComponentsModule } from './components/components.module';
import { ApplicationEditStylingComponent } from './application-edit-styling/application-edit-styling.component';
import { ImageUploadFieldComponent } from './styling/image-upload-field/image-upload-field.component';
import { ApplicationLayerSettingsComponent } from './application-layer-settings/application-layer-settings.component';

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
    ApplicationEditComponentsComponent,
    ApplicationLayerTreeComponent,
    ApplicationCatalogTreeComponent,
    ApplicationLayerTreeNodeComponent,
    ApplicationFolderNodeNameComponent,
    ApplicationEditStylingComponent,
    ImageUploadFieldComponent,
    ApplicationLayerSettingsComponent,
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
    RouterLinkActive,
    ComponentsModule,
 ],
  exports: [
    ApplicationListComponent,
  ],
})
export class ApplicationModule { }
