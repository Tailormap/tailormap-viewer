import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureInfoModule } from './feature-info/feature-info.module';
import { MapControlsComponent } from './map-controls/map-controls.component';
import { MenubarModule } from './menubar';
import { TocModule } from './toc';



@NgModule({
  declarations: [
    MapControlsComponent,
  ],
  imports: [
    CommonModule,
    FeatureInfoModule,
    MenubarModule,
    TocModule,
  ],
  exports: [
    FeatureInfoModule,
    MenubarModule,
    MapControlsComponent,
    TocModule,
  ],
})
export class ComponentsModule {}
