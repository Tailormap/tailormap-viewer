import { NgModule } from '@angular/core';
import { MenubarComponent } from './menubar.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarButtonComponent } from './menubar-button/menubar-button.component';
import { ProfileComponent } from './profile/profile.component';
import { MenubarPanelComponent } from './menubar-panel/menubar-panel.component';
import { MenubarLogoComponent } from './menubar-logo/menubar-logo.component';



@NgModule({
  declarations: [
    MenubarComponent,
    MenubarButtonComponent,
    ProfileComponent,
    MenubarPanelComponent,
    MenubarLogoComponent,
  ],
  imports: [
    SharedModule,
  ],
  exports: [
    MenubarComponent,
    MenubarButtonComponent,
    MenubarPanelComponent,
  ],
})
export class MenubarModule { }
