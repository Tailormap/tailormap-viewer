import { NgModule } from '@angular/core';
import { SharedModule } from '@tailormap-viewer/shared';
import { RegisteredComponentsModule } from '../registered-components-renderer/registered-components.module';
import { MatBadge } from '@angular/material/badge';
import { MobileMenubarBottomComponent } from './mobile-menubar-bottom.component';
import { CoreSharedModule } from '../../shared/core-shared.module';
import { MobileMenubarHomeComponent } from './mobile-menubar-home/mobile-menubar-home/mobile-menubar-home.component';
import { MobileMenubarHomeButtonComponent } from './mobile-menubar-home/mobile-menubar-home-button/mobile-menubar-home-button.component';
import { MenubarModule } from '../menubar/menubar.module';
import { MobileMenubarPanelComponent } from './mobile-menubar-panel/mobile-menubar-panel.component';

@NgModule({
  declarations: [
    MobileMenubarBottomComponent,
    MobileMenubarHomeComponent,
    MobileMenubarHomeButtonComponent,
    MobileMenubarPanelComponent,
  ],
  imports: [
    SharedModule,
    RegisteredComponentsModule,
    CoreSharedModule,
    MatBadge,
    MenubarModule,
  ],
  exports: [
    MobileMenubarBottomComponent,
    MobileMenubarHomeComponent,
    MobileMenubarHomeButtonComponent,
    MobileMenubarPanelComponent,
  ],
})
export class MobileMenubarBottomModule { }
