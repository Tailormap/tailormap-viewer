import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { TerrainLayerToggleComponent } from './terrain-layer-toggle.component';

@NgModule({
  declarations: [
    TerrainLayerToggleComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    TerrainLayerToggleComponent,
  ],
})
export class TerrainLayerToggleModule {
}
