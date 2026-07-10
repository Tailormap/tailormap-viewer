import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationMapService } from './services/application-map.service';
import { SharedModule } from '@tailormap-viewer/shared';
import { MapSpinnerComponent } from './components/map-spinner/map-spinner.component';

@NgModule({
  declarations: [
    MapSpinnerComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    MapSpinnerComponent,
  ],
})
export class ApplicationMapModule {
  //eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(_applicationMapService: ApplicationMapService) { /* constructor is used to initialize the service */ }
}
