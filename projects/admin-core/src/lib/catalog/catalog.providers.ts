import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { provideState } from '@ngrx/store';
import { catalogReducer } from './state/catalog.reducer';
import { catalogStateKey } from './state/catalog.state';
import { GeoServiceService } from './services/geo-service.service';
import { FeatureSourceService } from './services/feature-source.service';
import { CatalogService } from './services/catalog.service';

export function provideCatalog(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(catalogStateKey, catalogReducer),
    provideEnvironmentInitializer(() => {
      inject(GeoServiceService).listenForGeoServiceChanges();
      inject(FeatureSourceService).listenForFeatureSourceChanges();
      inject(CatalogService).listenForCatalogChanges();
    }),
  ];
}
