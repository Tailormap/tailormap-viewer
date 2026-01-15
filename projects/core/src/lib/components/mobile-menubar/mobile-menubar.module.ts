import { NgModule } from '@angular/core';
import { SharedModule } from '@tailormap-viewer/shared';
import { RegisteredComponentsModule } from '../registered-components-renderer/registered-components.module';
import { MatBadge } from '@angular/material/badge';
import { MobileMenubarComponent } from './mobile-menubar/mobile-menubar.component';
import { CoreSharedModule } from '../../shared/core-shared.module';
import { MenubarModule } from '../menubar/menubar.module';
import { MobileMenubarPanelComponent } from './mobile-menubar-panel/mobile-menubar-panel.component';
import { TocModule } from '../toc';
import { InfoModule } from '../info';
import { MobileMenubarHomeComponent } from './mobile-menubar-home/mobile-menubar-home.component';
import { MobileMenubarHomeButtonComponent } from './mobile-menubar-home-button/mobile-menubar-home-button.component';

@NgModule({
  declarations: [
    MobileMenubarComponent,
    MobileMenubarPanelComponent,
    MobileMenubarHomeComponent,
    MobileMenubarHomeButtonComponent,
  ],
  imports: [
    SharedModule,
    RegisteredComponentsModule,
    CoreSharedModule,
    MatBadge,
    MenubarModule,
    TocModule,
    InfoModule,
    CoreSharedModule,
  ],
  exports: [
    MobileMenubarComponent,
    MobileMenubarPanelComponent,
    MobileMenubarHomeComponent,
    MobileMenubarHomeButtonComponent,
  ],
})
export class MobileMenubarModule { }
