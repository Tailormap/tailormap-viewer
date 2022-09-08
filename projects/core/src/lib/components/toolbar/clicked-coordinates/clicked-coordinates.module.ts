import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ClickedCoordinatesComponent } from './clicked-coordinates.component';

@NgModule({
  declarations: [
    ClickedCoordinatesComponent,
  ],
  imports: [
    CommonModule,
    ClipboardModule,
    SharedModule,
  ],
  exports: [
    ClickedCoordinatesComponent,
  ],
})
export class ClickedCoordinatesModule {
}
