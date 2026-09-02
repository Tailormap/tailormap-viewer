import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LegendComponent } from './legend/legend.component';
import { LegendMenuButtonComponent } from './legend-menu-button/legend-menu-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarModule } from '../menubar';
import { LegendLayerComponent } from './legend-layer/legend-layer.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        MenubarModule,
        LegendComponent,
        LegendMenuButtonComponent,
        LegendLayerComponent,
    ],
    exports: [
        LegendComponent,
        LegendLayerComponent,
    ],
})
export class LegendModule { }
