import { inject, NgModule, provideEnvironmentInitializer } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { FilterDescriptionComponent } from './filter-description/filter-description.component';
import { SpatialFilterReferenceLayerService } from './services/spatial-filter-reference-layer.service';
import { FilterApiService } from './services/filter-api.service';



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
  providers: [
    provideEnvironmentInitializer(() => {
      inject(SpatialFilterReferenceLayerService); // instantiated here to watch for changes
      inject(FilterApiService).initDefaultFilterSource();
    }),
  ],
})
export class FilterModule {
}
