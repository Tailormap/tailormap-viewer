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
import { Switch3dModule } from "../toolbar/switch3d/switch3d.module";
import { StreetviewModule } from "../toolbar/streetview/streetview.module";
import { MeasureModule } from "../toolbar/measure/measure.module";

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
    Switch3dModule,
    StreetviewModule,
    MeasureModule,
  ],
  exports: [
    MobileMenubarComponent,
    MobileMenubarPanelComponent,
    MobileMenubarHomeComponent,
    MobileMenubarHomeButtonComponent,
  ],
})
export class MobileMenubarModule { }
