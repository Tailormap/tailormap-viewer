import { NgModule } from '@angular/core';
import { SharedModule } from '@tailormap-viewer/shared';
import { RegisteredComponentsModule } from '../registered-components-renderer/registered-components.module';
import { MatBadge } from '@angular/material/badge';
import { MobileMenubarBottomComponent } from './mobile-menubar-bottom/mobile-menubar-bottom.component';
import { CoreSharedModule } from '../../shared/core-shared.module';
import { MenubarModule } from '../menubar/menubar.module';
import { MobileMenubarPanelComponent } from './mobile-menubar-panel/mobile-menubar-panel.component';
import { TocModule } from '../toc';
import { InfoModule } from '../info';
import { MobileMenubarHomeModule } from '../mobile-menubar-home/mobile-menubar-home.module';

@NgModule({
  declarations: [
    MobileMenubarBottomComponent,
    MobileMenubarPanelComponent,
  ],
  imports: [
    SharedModule,
    RegisteredComponentsModule,
    CoreSharedModule,
    MatBadge,
    MenubarModule,
    TocModule,
    InfoModule,
    MobileMenubarHomeModule,
  ],
  exports: [
    MobileMenubarBottomComponent,
    MobileMenubarPanelComponent,
  ],
})
export class MobileMenubarBottomModule { }
