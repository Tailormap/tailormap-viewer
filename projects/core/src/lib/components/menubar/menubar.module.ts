import { NgModule } from '@angular/core';
import { MenubarComponent } from './menubar.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MenubarButtonComponent } from './menubar-button/menubar-button.component';
import { ProfileComponent } from './profile/profile.component';



@NgModule({
  declarations: [
    MenubarComponent,
    MenubarButtonComponent,
    ProfileComponent,
  ],
  imports: [
    SharedImportsModule,
  ],
  exports: [
    MenubarComponent,
    MenubarButtonComponent,
  ],
})
export class MenubarModule { }
