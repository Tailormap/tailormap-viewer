import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureInfoModule } from './feature-info/feature-info.module';
import { MapControlsComponent } from './map-controls/map-controls.component';
import { MenubarModule } from './menubar';
import { TocModule } from './toc';
import { ToolbarModule } from './toolbar';
import { LegendModule } from './legend';
import { BackgroundLayerToggleModule } from './background-layer-toggle';
import { DrawingModule } from './drawing/drawing.module';
import { AttributeListModule } from './attribute-list/attribute-list.module';
import { PrintModule } from './print/print.module';
import { FilterComponentModule } from './filter/filter-component.module';
import { EditComponentModule } from './edit/edit-component.module';

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
    DrawingModule,
    AttributeListModule,
    PrintModule,
    FilterComponentModule,
    EditComponentModule,
  ],
})
export class ComponentsModule {}
