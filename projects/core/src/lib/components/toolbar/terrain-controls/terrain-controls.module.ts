import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { TerrainControlsComponent } from './terrain-controls.component';
import { TerrainOpacityComponent } from './terrain-opacity/terrain-opacity.component';
import { TerrainLayerToggleComponent } from './terrain-layer-toggle/terrain-layer-toggle.component';
import { TerrainControlsMenuButtonComponent } from './terrain-controls-menu-button/terrain-controls-menu-button.component';
import { MenubarModule } from '../../menubar';


@NgModule({
  declarations: [
    TerrainControlsComponent,
    TerrainOpacityComponent,
    TerrainLayerToggleComponent,
    TerrainControlsMenuButtonComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
  ],
  exports: [
    TerrainControlsComponent,
    TerrainLayerToggleComponent,
    TerrainOpacityComponent,
  ],
})
export class TerrainControlsModule {
}
