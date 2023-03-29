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
import { RouterLink } from '@angular/router';
import { FeatureSourceFormDialogComponent } from './feature-source-form-dialog/feature-source-form-dialog.component';
import { FeatureTypeDetailsComponent } from './feature-type-details/feature-type-details.component';



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
  ],
    imports: [
        CommonModule,
        SharedModule,
        StoreModule.forFeature(catalogStateKey, catalogReducer),
        EffectsModule.forFeature([CatalogEffects]),
        SharedAdminComponentsModule,
        RouterLink,
    ],
  exports: [
    CatalogTreeComponent,
  ],
})
export class CatalogModule { }
