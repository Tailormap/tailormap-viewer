import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureInfoModule } from './feature-info/feature-info.module';
import { MapControlsComponent } from './map-controls/map-controls.component';
import { MenubarModule } from './menubar';
import { ZoomButtonsComponent } from './zoom-buttons/zoom-buttons.component';
import { SharedImportsModule } from "@tailormap-viewer/shared";



@NgModule({
  declarations: [
    MapControlsComponent,
    ZoomButtonsComponent,
  ],
    imports: [
        CommonModule,
        FeatureInfoModule,
        MenubarModule,
        SharedImportsModule,
    ],
  exports: [
    FeatureInfoModule,
    MenubarModule,
    MapControlsComponent,
    ZoomButtonsComponent,
  ],
})
export class ComponentsModule {}
