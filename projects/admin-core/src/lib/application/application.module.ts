import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { applicationStateKey } from './state/application.state';
import { applicationReducer } from './state/application.reducer';
import { StoreModule } from '@ngrx/store';
import { ApplicationEditSettingsComponent } from './application-edit-settings/application-edit-settings.component';
import { ApplicationCreateComponent } from './application-create/application-create.component';
import { ApplicationListComponent } from './application-list/application-list.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { RouterOutlet } from '@angular/router';
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
import { ApplicationLayerSettingsComponent } from './application-layer-settings/application-layer-settings.component';
import { ApplicationService } from './services/application.service';
import {
  ApplicationLayerAttributeSettingsComponent,
} from './application-layer-attribute-settings/application-layer-attribute-settings.component';
import { FormModule } from "../form/form.module";
import { ApplicationCopyDialogComponent } from './application-copy-dialog/application-copy-dialog.component';
import { ApplicationEditTerrainLayersComponent } from './application-edit-terrain-layers/application-edit-terrain-layers.component';
import { ApplicationFilterGroupListComponent } from './application-edit-filters/filter-group-list/application-filter-group-list.component';
import { ApplicationCreateFilterGroupComponent } from './application-edit-filters/filter-group-create/application-create-filter-group.component';
import { ApplicationDatePickerFilterFormComponent } from './application-edit-filters/filters/application-date-picker-filter-form/application-date-picker-filter-form.component';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ApplicationEditFiltersComponent } from './application-edit-filters/application-edit-filters.component';
import { ApplicationEditFiltersHomeComponent } from './application-edit-filters/filter-group-home/application-edit-filters-home.component';
import { ApplicationEditFilterComponent } from './application-edit-filters/filter-group-edit/application-edit-filter.component';
import {
  ApplicationCheckboxFilterFormComponent, ApplicationEditFilterFormComponent, ApplicationFilterAttributeListComponent,
  ApplicationFiltersListComponent,
  ApplicationSliderFilterFormComponent, ApplicationSwitchFilterFormComponent,
} from './application-edit-filters/filters';

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
    ApplicationLayerSettingsComponent,
    ApplicationLayerAttributeSettingsComponent,
    ApplicationCopyDialogComponent,
    ApplicationEditTerrainLayersComponent,
    ApplicationEditFiltersComponent,
    ApplicationFilterGroupListComponent,
    ApplicationEditFiltersHomeComponent,
    ApplicationEditFilterComponent,
    ApplicationCreateFilterGroupComponent,
    ApplicationFilterAttributeListComponent,
    ApplicationFiltersListComponent,
    ApplicationCheckboxFilterFormComponent,
    ApplicationSliderFilterFormComponent,
    ApplicationSwitchFilterFormComponent,
    ApplicationEditFilterFormComponent,
    ApplicationDatePickerFilterFormComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(applicationStateKey, applicationReducer),
    EffectsModule.forFeature([ApplicationEffects]),
    SharedAdminComponentsModule,
    RouterOutlet,
    CatalogModule,
    ComponentsModule,
    FormModule,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
  ],
    exports: [
        ApplicationListComponent,
    ],
})
export class ApplicationModule {
  constructor(applicationService: ApplicationService) {
    applicationService.listenForApplicationChanges();
  }
}
