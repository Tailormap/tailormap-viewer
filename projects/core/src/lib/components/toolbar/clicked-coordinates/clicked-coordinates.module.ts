import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ClickedCoordinatesComponent } from './clicked-coordinates.component';
import { ClickedCoordinatesMenuButtonComponent } from './clicked-coordinates-menu-button/clicked-coordinates-menu-button.component';
import { MenubarModule } from "../../menubar";

@NgModule({
  declarations: [
    ClickedCoordinatesComponent,
    ClickedCoordinatesMenuButtonComponent,
  ],
  imports: [
    CommonModule,
    ClipboardModule,
    SharedModule,
    MenubarModule,
  ],
  exports: [
    ClickedCoordinatesComponent,
  ],
})
export class ClickedCoordinatesModule {
}
