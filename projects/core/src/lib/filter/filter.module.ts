import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { filterStateKey } from './state/filter.state';
import { filterReducer } from './state/filter.reducer';
import { AttributeFilterComponent } from './attribute-filter/attribute-filter.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { FilterDescriptionComponent } from './filter-description/filter-description.component';
import { SpatialFilterReferenceLayerService } from './services/spatial-filter-reference-layer.service';



@NgModule({
  declarations: [
    AttributeFilterComponent,
    FilterDescriptionComponent,
  ],
  imports: [
    CommonModule,
    StoreModule.forFeature(filterStateKey, filterReducer),
    SharedModule,
  ],
  exports: [
    AttributeFilterComponent,
    FilterDescriptionComponent,
  ],
})
export class FilterModule {
  constructor(_spatialFilterReferenceLayerService: SpatialFilterReferenceLayerService) {
    // constructor is used to initialize the service
  }
}
