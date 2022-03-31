import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureInfoModule } from './feature-info/feature-info.module';
import { MapControlsComponent } from './map-controls/map-controls.component';
import { MenubarModule } from './menubar';
import { ZoomButtonsModule } from './zoom-buttons';
import { TocModule } from './toc';
import { MeasureModule } from './measure/measure.module';


@NgModule({
  declarations: [
    MapControlsComponent,
  ],
  imports: [
    CommonModule,
    FeatureInfoModule,
    MenubarModule,
    ZoomButtonsModule,
    TocModule,
    MeasureModule,
  ],
  exports: [
    FeatureInfoModule,
    MenubarModule,
    ZoomButtonsModule,
    MapControlsComponent,
    TocModule,
    MeasureModule,
  ],
})
export class ComponentsModule {}
