import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { FilterDescriptionComponent } from './filter-description/filter-description.component';
import { SpatialFilterReferenceLayerService } from './services/spatial-filter-reference-layer.service';



@NgModule({
  declarations: [
    FilterDescriptionComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    FilterDescriptionComponent,
  ],
})
export class FilterModule {
  //eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(_spatialFilterReferenceLayerService: SpatialFilterReferenceLayerService) {
    // constructor is used to initialize the service
  }
}
