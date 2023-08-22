import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { FeatureSourceModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel } from '@tailormap-admin/admin-api';
import { selectFeatureSourceAndFeatureTypesById } from '../state/catalog.selectors';
import { filter, Observable, of, switchMap, take, tap } from 'rxjs';
import { addFeatureSources } from '../state/catalog.actions';

@Injectable({
  providedIn: 'root',
})
export class CatalogDataService {

  private loadingFeatureSources = new Map<string, Observable<FeatureSourceModel>>();

  constructor(
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
  ) {}

  public getFeatureSourceById$(featureSourceId: string) {
    return this.store$.select(selectFeatureSourceAndFeatureTypesById(featureSourceId))
      .pipe(
        take(1),
        switchMap(featureSource => {
          if (!featureSource) {
            return this.loadFeatureSourceFromApi$(featureSourceId);
          }
          return of(featureSource);
        }),
        filter((featureSource): featureSource is FeatureSourceModel => !!featureSource),
      );
  }

  private loadFeatureSourceFromApi$(featureSourceId: string): Observable<FeatureSourceModel> {
    const currentlyLoadingSource$ = this.loadingFeatureSources.get(featureSourceId);
    if (currentlyLoadingSource$) {
      return currentlyLoadingSource$;
    }
    const loader$ = this.adminApiService.getFeatureSource$({ id: featureSourceId })
      .pipe(
        tap(sourceFromApi => {
          this.store$.dispatch(addFeatureSources({ featureSources: [sourceFromApi], parentNode: "" }));
        }),
      );
    this.loadingFeatureSources.set(featureSourceId, loader$);
    return loader$;
  }

}
