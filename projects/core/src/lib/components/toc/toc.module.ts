import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TocComponent } from './toc/toc.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { TocMenuButtonComponent } from './toc-menu-button/toc-menu-button.component';
import { MenubarModule } from '../menubar';
import { TocNodeLayerComponent } from './toc-node-layer/toc-node-layer.component';
import { ToggleAllLayersButtonComponent } from './toggle-all-layers-button/toggle-all-layers-button.component';
import { LayerDetailsComponent } from './layer-details/layer-details.component';
import { LegendModule } from '../legend';

@NgModule({
  declarations: [
    TocComponent,
    TocMenuButtonComponent,
    TocNodeLayerComponent,
    ToggleAllLayersButtonComponent,
    LayerDetailsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
    LegendModule,
  ],
  exports: [
    TocComponent,
  ],
})
export class TocModule { }
