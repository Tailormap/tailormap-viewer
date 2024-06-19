import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { catalogReducer } from './state/catalog.reducer';
import { catalogStateKey } from './state/catalog.state';
import { StoreModule } from '@ngrx/store';
import { CatalogTreeComponent } from './catalog-tree/catalog-tree.component';
import { EffectsModule } from '@ngrx/effects';
import { CatalogEffects } from './state/catalog.effects';
import { CatalogTreeNodeComponent } from './catalog-tree/catalog-tree-node/catalog-tree-node.component';
import { GeoServiceDetailsComponent } from './geo-service-details/geo-service-details.component';
import { GeoServiceLayerDetailsComponent } from './geo-service-layer-details/geo-service-layer-details.component';
import { CatalogNodeDetailsComponent } from './catalog-node-details/catalog-node-details.component';
import { CatalogNodeFormComponent } from './catalog-node-form/catalog-node-form.component';
import { CatalogNodeFormDialogComponent } from './catalog-node-form-dialog/catalog-node-form-dialog.component';
import { GeoServiceFormDialogComponent } from './geo-service-form-dialog/geo-service-form-dialog.component';
import { GeoServiceFormComponent } from './geo-service-form/geo-service-form.component';
import { LayerSettingsFormComponent } from './layer-settings-form/layer-settings-form.component';
import { SharedAdminComponentsModule } from '../shared/components/shared-admin-components.module';
import { FeatureSourceDetailsComponent } from './feature-source-details/feature-source-details.component';
import { FeatureSourceFormComponent } from './feature-source-form/feature-source-form.component';
import { FeatureSourceFormDialogComponent } from './feature-source-form-dialog/feature-source-form-dialog.component';
import { FeatureTypeDetailsComponent } from './feature-type-details/feature-type-details.component';
import { FeatureTypeSelectorComponent } from './feature-type-selector/feature-type-selector.component';
import { CatalogBaseTreeComponent } from './catalog-base-tree/catalog-base-tree.component';
import { CatalogBaseTreeNodeComponent } from './catalog-base-tree/catalog-base-tree-node/catalog-base-tree-node.component';
import { CatalogHomeComponent } from './catalog-home/catalog-home.component';
import { CatalogCreateButtonsComponent } from './catalog-create-buttons/catalog-create-buttons.component';
import { GeoServiceUsedDialogComponent } from './geo-service-details/geo-service-used-dialog/geo-service-used-dialog.component';
import { GeoServiceLayerFormDialogComponent } from './geo-service-layer-form-dialog/geo-service-layer-form-dialog.component';
import { FeatureSourceUsedDialogComponent } from './feature-source-details/feature-source-used-dialog/feature-source-used-dialog.component';
import { GeoServiceService } from './services/geo-service.service';
import { FeatureSourceService } from './services/feature-source.service';
import { CatalogService } from './services/catalog.service';
import {
  CatalogItemsInFolderDialogComponent,
} from './catalog-node-details/catalog-items-in-folder-dialog/catalog-items-in-folder-dialog.component';
import { FeatureTypeAttributesComponent } from './feature-type-attributes/feature-type-attributes.component';
import { FeatureTypeFormComponent } from './feature-type-form/feature-type-form.component';
import { FeatureTypeFormDialogComponent } from './feature-type-form-dialog/feature-type-form-dialog.component';


@NgModule({
  declarations: [
    CatalogTreeComponent,
    CatalogTreeNodeComponent,
    GeoServiceDetailsComponent,
    GeoServiceLayerDetailsComponent,
    CatalogNodeDetailsComponent,
    CatalogNodeFormComponent,
    CatalogNodeFormDialogComponent,
    GeoServiceFormDialogComponent,
    GeoServiceFormComponent,
    LayerSettingsFormComponent,
    FeatureSourceDetailsComponent,
    FeatureSourceFormComponent,
    FeatureSourceFormDialogComponent,
    FeatureTypeDetailsComponent,
    FeatureTypeSelectorComponent,
    FeatureTypeFormComponent,
    FeatureTypeFormDialogComponent,
    CatalogBaseTreeComponent,
    CatalogBaseTreeNodeComponent,
    CatalogHomeComponent,
    CatalogCreateButtonsComponent,
    GeoServiceUsedDialogComponent,
    GeoServiceLayerFormDialogComponent,
    FeatureSourceUsedDialogComponent,
    CatalogItemsInFolderDialogComponent,
    FeatureTypeAttributesComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(catalogStateKey, catalogReducer),
    EffectsModule.forFeature([CatalogEffects]),
    SharedAdminComponentsModule,
  ],
  exports: [
    CatalogTreeComponent,
    CatalogBaseTreeComponent,
    CatalogBaseTreeNodeComponent,
    FeatureTypeAttributesComponent,
    FeatureTypeSelectorComponent,
  ],
})
export class CatalogModule {
  constructor(
    geoServiceService: GeoServiceService,
    featureSourceService: FeatureSourceService,
    catalogService: CatalogService,
  ) {
    geoServiceService.listenForGeoServiceChanges();
    featureSourceService.listenForFeatureSourceChanges();
    catalogService.listenForCatalogChanges();
  }
}
