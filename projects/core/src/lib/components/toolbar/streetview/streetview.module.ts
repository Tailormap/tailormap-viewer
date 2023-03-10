import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { StreetviewComponent } from './streetview.component';

@NgModule({
  declarations: [
    StreetviewComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    StreetviewComponent,
  ],
})
export class StreetviewModule {
}
