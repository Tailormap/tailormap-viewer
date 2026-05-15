import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { CoordinateLinkWindowComponent } from './coordinate-link-window.component';
import { CoordinateLinkWindowMenuButtonComponent } from './coordinate-link-window-menu-button/coordinate-link-window-menu-button.component';
import { MenubarModule } from "../../menubar";

@NgModule({
  declarations: [
    CoordinateLinkWindowComponent,
    CoordinateLinkWindowMenuButtonComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
  ],
  exports: [
    CoordinateLinkWindowComponent,
  ],
})
export class CoordinateLinkWindowModule {
}
