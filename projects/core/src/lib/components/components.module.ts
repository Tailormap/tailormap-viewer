import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureInfoModule } from './feature-info/feature-info.module';
import { MapControlsComponent } from './map-controls/map-controls.component';
import { MenubarModule } from './menubar';
import { TocModule } from './toc';
import { ToolbarModule } from './toolbar';

@NgModule({
  declarations: [
    MapControlsComponent,
  ],
  imports: [
    CommonModule,
    FeatureInfoModule,
    MenubarModule,
    TocModule,
    ToolbarModule,
  ],
  exports: [
    FeatureInfoModule,
    MenubarModule,
    MapControlsComponent,
    TocModule,
    ToolbarModule,
  ],
})
export class ComponentsModule {}
