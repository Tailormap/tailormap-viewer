import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeolocationComponent } from './geolocation.component';
import { SharedModule } from '@tailormap-viewer/shared';

@NgModule({
  declarations: [
    GeolocationComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    GeolocationComponent,
  ],
})
export class GeolocationModule { }
