import { NgModule } from '@angular/core';


import { MatBadge } from '@angular/material/badge';
import { MobileMenubarComponent } from './mobile-menubar/mobile-menubar.component';


import { MobileMenubarPanelComponent } from './mobile-menubar-panel/mobile-menubar-panel.component';
import { TocModule } from '../toc';

import { MobileMenubarHomeComponent } from './mobile-menubar-home/mobile-menubar-home.component';
import { MobileMenubarHomeButtonComponent } from './mobile-menubar-home-button/mobile-menubar-home-button.component';




@NgModule({
    imports: [
    MatBadge,
    TocModule,
    MobileMenubarComponent,
    MobileMenubarPanelComponent,
    MobileMenubarHomeComponent,
    MobileMenubarHomeButtonComponent,
],
    exports: [
        MobileMenubarComponent,
        MobileMenubarPanelComponent,
        MobileMenubarHomeComponent,
        MobileMenubarHomeButtonComponent,
    ],
})
export class MobileMenubarModule { }
