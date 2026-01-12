import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TocComponent } from './toc/toc.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { TocMenuButtonComponent } from './toc-menu-button/toc-menu-button.component';
import { MenubarModule } from '../menubar';
import { TocNodeLayerComponent } from './toc-node-layer/toc-node-layer.component';
import { ToggleAllLayersButtonComponent } from './toggle-all-layers-button/toggle-all-layers-button.component';
import { TocNodeDetailsComponent } from './toc-node-details/toc-node-details.component';
import { LegendModule } from '../legend';
import { LayerTransparencyComponent } from './toc-node-details/layer-transparency/layer-transparency.component';
import { LayerDetailsComponent } from './toc-node-details/layer-details/layer-details.component';
import { StoreModule } from '@ngrx/store';
import { tocStateKey } from './state/toc.state';
import { tocReducer } from './state/toc.reducer';
import { TocFilterInputComponent } from './toc-filter-input/toc-filter-input.component';
import { MobileTocComponent } from './mobile-toc/mobile-toc.component';
import { BackgroundLayerToggleModule } from '../background-layer-toggle';
import { TerrainControlsModule } from '../toolbar/terrain-controls/terrain-controls.module';

@NgModule({
  declarations: [
    TocComponent,
    TocMenuButtonComponent,
    TocNodeLayerComponent,
    ToggleAllLayersButtonComponent,
    TocNodeDetailsComponent,
    LayerTransparencyComponent,
    LayerDetailsComponent,
    TocFilterInputComponent,
    MobileTocComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
    LegendModule,
    StoreModule.forFeature(tocStateKey, tocReducer),
    BackgroundLayerToggleModule,
    TerrainControlsModule,
  ],
  exports: [
    TocComponent,
    MobileTocComponent,
  ],
})
export class TocModule { }
