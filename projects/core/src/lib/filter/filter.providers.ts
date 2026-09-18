import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { SpatialFilterReferenceLayerService } from './services/spatial-filter-reference-layer.service';

export function provideFilter(): Array<Provider | EnvironmentProviders> {
  return [
    provideEnvironmentInitializer(() => {
      inject(SpatialFilterReferenceLayerService); // instantiated here to watch for changes
    }),
  ];
}
