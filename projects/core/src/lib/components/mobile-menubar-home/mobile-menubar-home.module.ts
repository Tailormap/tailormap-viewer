import { NgModule } from '@angular/core';
import { MobileMenubarHomeButtonComponent } from './mobile-menubar-home-button/mobile-menubar-home-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { RegisteredComponentsModule } from '../registered-components-renderer/registered-components.module';
import { MatBadge } from '@angular/material/badge';
import { TocModule } from '../toc';
import { InfoModule } from '../info';
import { MobileMenubarHomeComponent } from './mobile-menubar-home/mobile-menubar-home.component';
import { CoreSharedModule } from '../../shared/core-shared.module';
import { MenubarModule } from '../menubar/menubar.module';


@NgModule({
  declarations: [
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
  ],
  exports: [
    MobileMenubarHomeComponent,
    MobileMenubarHomeButtonComponent,
  ],
})
export class MobileMenubarHomeModule { }
