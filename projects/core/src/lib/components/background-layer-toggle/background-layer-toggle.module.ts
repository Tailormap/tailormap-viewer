import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedComponentsModule, SharedImportsModule } from '@tailormap-viewer/shared';
import { BackgroundLayerToggleComponent } from './background-layer-toggle.component';



@NgModule({
  declarations: [
    BackgroundLayerToggleComponent,
  ],
  imports: [
    CommonModule,
    SharedImportsModule,
    SharedComponentsModule,
  ],
  exports: [
    BackgroundLayerToggleComponent,
  ],
})
export class BackgroundLayerToggleModule { }
