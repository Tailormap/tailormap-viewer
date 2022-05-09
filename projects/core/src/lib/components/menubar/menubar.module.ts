import { NgModule } from '@angular/core';
import { MenubarComponent } from './menubar.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarButtonComponent } from './menubar-button/menubar-button.component';
import { ProfileComponent } from './profile/profile.component';
import { MenubarPanelComponent } from './menubar-panel/menubar-panel.component';



@NgModule({
  declarations: [
    MenubarComponent,
    MenubarButtonComponent,
    ProfileComponent,
    MenubarPanelComponent,
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
