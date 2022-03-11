import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZoomButtonsComponent } from './zoom-buttons.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';

@NgModule({
  declarations: [
    ZoomButtonsComponent,
  ],
  imports: [
    CommonModule,
    SharedImportsModule,
  ],
  exports: [
    ZoomButtonsComponent,
  ],
})
export class ZoomButtonsModule { }
