import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ClickedCoordinatesComponent } from './clicked-coordinates.component';

@NgModule({
  declarations: [
    ClickedCoordinatesComponent,
  ],
  imports: [
    CommonModule,
    SharedImportsModule,
    ClipboardModule,
  ],
  exports: [
    ClickedCoordinatesComponent,
  ],
})
export class ClickedCoordinatesModule {
}
