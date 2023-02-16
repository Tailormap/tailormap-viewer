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



@NgModule({
  declarations: [
    CatalogTreeComponent,
    CatalogTreeNodeComponent,
    GeoServiceDetailsComponent,
    GeoServiceLayerDetailsComponent,
    CatalogNodeDetailsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(catalogStateKey, catalogReducer),
    EffectsModule.forFeature([CatalogEffects]),
  ],
  exports: [
    CatalogTreeComponent,
  ],
})
export class CatalogModule { }
