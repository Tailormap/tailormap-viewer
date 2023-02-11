import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { catalogReducer } from './state/catalog.reducer';
import { catalogStateKey } from './state/catalog.state';
import { StoreModule } from '@ngrx/store';
import { CatalogTreeComponent } from './geo-registry-tree/catalog-tree.component';
import { EffectsModule } from '@ngrx/effects';
import { CatalogEffects } from './state/catalog.effects';



@NgModule({
  declarations: [
    CatalogTreeComponent,
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
