import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureInfoModule } from './feature-info/feature-info.module';
import { MapControlsComponent } from './map-controls/map-controls.component';



@NgModule({
  declarations: [
    MapControlsComponent,
  ],
  imports: [
    CommonModule,
    FeatureInfoModule,
  ],
  exports: [
    FeatureInfoModule,
    MapControlsComponent,
  ],
})
export class ComponentsModule {}
