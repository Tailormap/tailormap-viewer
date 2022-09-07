import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TocComponent } from './toc/toc.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { TocMenuButtonComponent } from './toc-menu-button/toc-menu-button.component';
import { MenubarModule } from '../menubar';
import { TocNodeLayerComponent } from './toc-node-layer/toc-node-layer.component';

@NgModule({
  declarations: [
    TocComponent,
    TocMenuButtonComponent,
    TocNodeLayerComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
  ],
  exports: [
    TocComponent,
  ],
})
export class TocModule { }
