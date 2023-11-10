import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { selectFeatureSourceAndFeatureTypesById } from '../state/catalog.selectors';
import { filter, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { addFeatureSources } from '../state/catalog.actions';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedCatalogModelHelper } from '../helpers/extended-catalog-model.helper';

@Injectable({
  providedIn: 'root',
})
export class CatalogDataService {

  private loadingFeatureSources = new Map<string, Observable<ExtendedFeatureSourceModel>>();

  constructor(
    private store$: Store,
    private adminApiService: TailormapAdminApiV1Service,
  ) {}

  public getFeatureSourceById$(featureSourceId: string): Observable<ExtendedFeatureSourceModel> {
    return this.store$.select(selectFeatureSourceAndFeatureTypesById(featureSourceId))
      .pipe(
        take(1),
        switchMap(featureSource => {
          if (!featureSource) {
            return this.loadFeatureSourceFromApi$(featureSourceId);
          }
          return of(featureSource);
        }),
        filter((featureSource): featureSource is ExtendedFeatureSourceModel => !!featureSource),
      );
  }

  private loadFeatureSourceFromApi$(featureSourceId: string): Observable<ExtendedFeatureSourceModel> {
    const currentlyLoadingSource$ = this.loadingFeatureSources.get(featureSourceId);
    if (currentlyLoadingSource$) {
      return currentlyLoadingSource$;
    }
    const loader$ = this.adminApiService.getFeatureSource$({ id: featureSourceId })
      .pipe(
        tap(sourceFromApi => {
          this.store$.dispatch(addFeatureSources({ featureSources: [sourceFromApi], parentNode: "" }));
        }),
        map(featureSource => {
          const extendedModels = ExtendedCatalogModelHelper.getExtendedFeatureSource(featureSource, '');
          return {
            ...extendedModels[0],
            featureTypes: extendedModels[1],
          };
        }),
      );
    this.loadingFeatureSources.set(featureSourceId, loader$);
    return loader$;
  }

}
