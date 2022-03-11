import { Inject, Injectable } from '@angular/core';
import { FeaturesResponseModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectApplicationId, selectVisibleLayers } from '../../state/core.selectors';
import { combineLatest, concatMap, forkJoin, map, Observable, of, take } from 'rxjs';
import { FeatureInfoResponseModel } from './models/feature-info-response.model';

@Injectable({
  providedIn: 'root',
})
export class FeatureInfoService {

  private static DEFAULT_DISTANCE = 10;

  constructor(
    private store$: Store,
    @Inject(TAILORMAP_API_V1_SERVICE) private apiService: TailormapApiV1ServiceModel,
  ) {
  }

  public getFeatures$(coordinates: [ number, number ]): Observable<FeatureInfoResponseModel[]> {
    return combineLatest([
      this.store$.select(selectVisibleLayers),
      this.store$.select(selectApplicationId),
    ])
      .pipe(
        take(1),
        concatMap(([ layers, applicationId ]) => {
          if (!applicationId || layers.length === 0) {
            return of([]);
          }
          const featureRequests$ = layers.map(layer => {
            const layerId = layer.layer.id;
            return this.apiService.getFeatures$({
              layerId,
              applicationId,
              x: coordinates[0],
              y: coordinates[1],
              distance: FeatureInfoService.DEFAULT_DISTANCE,
              simplify: true,
            }).pipe(
              map((featureInfoResult: FeaturesResponseModel): FeatureInfoResponseModel => ({
                features: (featureInfoResult.features || []).map(feature => ({ ...feature, layerId })),
                columnMetadata: (featureInfoResult.columnMetadata || []).map(metadata => ({ ...metadata, layerId })),
              })),
            );
          });
          return forkJoin(featureRequests$);
        }),
      );
  }

}
