import { NgModule } from '@angular/core';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { TreeNodeLayerComponent } from './tree-node-layer';

@NgModule({
  declarations: [
    TreeNodeLayerComponent,
  ],
  imports: [
    SharedImportsModule,
  ],
  exports: [
    TreeNodeLayerComponent,
  ],
})
export class SharedCoreComponentsModule {
}
