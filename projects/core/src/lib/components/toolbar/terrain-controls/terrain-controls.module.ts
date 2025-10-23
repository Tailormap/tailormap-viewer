import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { TerrainControlsComponent } from './terrain-controls.component';
import { TerrainTranslucencyComponent } from './terrain-translucency/terrain-translucency.component';
import { TerrainLayerToggleComponent } from './terrain-layer-toggle/terrain-layer-toggle.component';


@NgModule({
  declarations: [
    TerrainControlsComponent,
    TerrainTranslucencyComponent,
    TerrainLayerToggleComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    TerrainControlsComponent,
  ],
})
export class TerrainControlsModule {
}
