import { inject, Injectable } from '@angular/core';
import { FeatureAttributeTypeEnum, FeaturesResponseModel, TAILORMAP_API_V1_SERVICE, FeatureModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectApplicationId } from '../../state/core.selectors';
import { catchError, combineLatest, concatMap, forkJoin, map, Observable, of, take } from 'rxjs';
import { FeatureInfoResponseModel } from './models/feature-info-response.model';
import { selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes } from '../../map/state/map.selectors';
import { MapResolutionModel, MapService } from '@tailormap-viewer/map';
import { AppLayerWithServiceModel } from '../../map/models';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class FeatureInfoService {

  private static LOAD_FEATURE_INFO_ERROR = $localize `Could not load feature info`;

  /**
   * default buffer distance for feature info requests in pixels.
   */
  private static DEFAULT_DISTANCE = 10;

  private store$ = inject(Store);
  private mapService = inject(MapService);
  private httpService = inject(HttpClient);
  private apiService = inject(TAILORMAP_API_V1_SERVICE);

  public getFeatures$(coordinates: [ number, number ]): Observable<FeatureInfoResponseModel[]> {
    return combineLatest([
      this.store$.select(selectVisibleLayersWithAttributes),
      this.store$.select(selectVisibleWMSLayersWithoutAttributes),
      this.store$.select(selectApplicationId),
      this.mapService.getResolution$(),
      this.mapService.getProjectionCode$(),
    ])
      .pipe(
        take(1),
        concatMap(([ layers, wmsLayers, applicationId, resolutions, projection ]) => {
          if (!applicationId || (layers.length === 0 && wmsLayers.length === 0)) {
            return of([]);
          }
          const featureRequests$ = [
            ...layers.map(layer => this.getFeatureInfoFromApi$(layer, coordinates, applicationId, resolutions, projection)),
            ...wmsLayers.map(layer => this.mapService.getFeatureInfoForLayers$(`${layer.id}`, coordinates, this.httpService).pipe(
              map(features => this.featuresToFeatureInfoResponseModel(features, layer.id)),
            )),
          ];
          return forkJoin(featureRequests$);
        }),
      );
  }

  private getFeatureInfoFromApi$(
    layer: AppLayerWithServiceModel,
    coordinates: [ number, number ],
    applicationId: number,
    resolutions: MapResolutionModel,
    projection: string,
  ): Observable<FeatureInfoResponseModel> {
    const layerId = layer.id;
    return this.apiService.getFeatures$({
      layerId,
      applicationId,
      x: coordinates[0],
      y: coordinates[1],
      crs: projection,
      // meters per pixel * fixed value
      distance: resolutions.resolution * FeatureInfoService.DEFAULT_DISTANCE,
      simplify: false,
    }).pipe(
      map((featureInfoResult: FeaturesResponseModel): FeatureInfoResponseModel => ({
        features: (featureInfoResult.features || []).map(feature => ({ ...feature, layerId })),
        columnMetadata: (featureInfoResult.columnMetadata || []).map(metadata => ({ ...metadata, layerId })),
        layerId,
      })),
      catchError((): Observable<FeatureInfoResponseModel> => {
        return of({
          features: [],
          columnMetadata: [],
          layerId,
          error: FeatureInfoService.LOAD_FEATURE_INFO_ERROR,
        });
      }),
    );
  }

  private featuresToFeatureInfoResponseModel(features: FeatureModel[], layerId: number): FeatureInfoResponseModel {
    const columnMetadata = Object.keys(features.length > 0 ? features[0].attributes : {}).map(key => ({
      layerId,
      type: FeatureAttributeTypeEnum.STRING,
      key,
      alias: key,
    }));
    return {
      features: features.map(feature => ({ ...feature, layerId })),
      columnMetadata,
      layerId,
    };
  }
}
