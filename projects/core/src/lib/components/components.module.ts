import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureInfoModule } from './feature-info/feature-info.module';
import { MapControlsComponent } from './map-controls/map-controls.component';
import { MenubarModule } from './menubar';
import { ZoomButtonsModule } from './zoom-buttons';

@NgModule({
  declarations: [
    MapControlsComponent,
  ],
  imports: [
    CommonModule,
    FeatureInfoModule,
    MenubarModule,
    ZoomButtonsModule,
  ],
  exports: [
    FeatureInfoModule,
    MenubarModule,
    ZoomButtonsModule,
    MapControlsComponent,
  ],
})
export class ComponentsModule {}
