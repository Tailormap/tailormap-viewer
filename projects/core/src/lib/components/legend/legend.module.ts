import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LegendComponent } from './legend/legend.component';
import { LegendMenuButtonComponent } from './legend-menu-button/legend-menu-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarModule } from '../menubar';
import { LegendLayerComponent } from './legend-layer/legend-layer.component';

@NgModule({
  declarations: [
    LegendComponent,
    LegendMenuButtonComponent,
    LegendLayerComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
  ],
  exports: [
    LegendComponent,
  ],
})
export class LegendModule { }
