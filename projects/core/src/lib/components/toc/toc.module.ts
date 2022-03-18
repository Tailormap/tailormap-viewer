import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TocComponent } from './toc/toc.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { TocMenuButtonComponent } from './toc-menu-button/toc-menu-button.component';
import { MenubarModule } from '../menubar';
import { SharedCoreComponentsModule } from '../../shared/components/shared-core-components.module';

@NgModule({
  declarations: [
    TocComponent,
    TocMenuButtonComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    SharedCoreComponentsModule,
    MenubarModule,
  ],
  exports: [
    TocComponent,
  ],
})
export class TocModule { }
