import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { TerrainTranslucencyComponent } from './terrain-translucency.component';


@NgModule({
  declarations: [
    TerrainTranslucencyComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    TerrainTranslucencyComponent,
  ],
})
export class TerrainTranslucencyModule {
}
