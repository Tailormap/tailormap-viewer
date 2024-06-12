import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { CoordinateLinkWindowComponent } from './coordinate-link-window.component';

@NgModule({
  declarations: [
    CoordinateLinkWindowComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    CoordinateLinkWindowComponent,
  ],
})
export class CoordinateLinkWindowModule {
}
