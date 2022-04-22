import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureInfoModule } from './feature-info/feature-info.module';
import { MapControlsComponent } from './map-controls/map-controls.component';
import { MenubarModule } from './menubar';
import { TocModule } from './toc';
import { ToolbarModule } from './toolbar';
import { LegendModule } from './legend';
import { BackgroundLayerToggleModule } from './background-layer-toggle';

@NgModule({
  declarations: [
    MapControlsComponent,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    FeatureInfoModule,
    MenubarModule,
    MapControlsComponent,
    TocModule,
    ToolbarModule,
    LegendModule,
    BackgroundLayerToggleModule,
  ],
})
export class ComponentsModule {}
