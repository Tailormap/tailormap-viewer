import { inject, Injectable } from '@angular/core';
import { FeatureAttributeTypeEnum, FeaturesResponseModel, TAILORMAP_API_V1_SERVICE, FeatureModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectViewerId } from '../../state/core.selectors';
import { catchError, combineLatest, concatMap, forkJoin, map, Observable, of, take } from 'rxjs';
import { FeatureInfoResponseModel } from './models/feature-info-response.model';
import {
  selectEditableLayers, selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes,
} from '../../map/state/map.selectors';
import { MapService, MapViewDetailsModel } from '@tailormap-viewer/map';
import { HttpClient } from '@angular/common/http';
import { ExtendedAppLayerModel } from '../../map/models';

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
      this.store$.select(selectViewerId),
      this.mapService.getMapViewDetails$(),
      this.mapService.getProjectionCode$(),
    ])
      .pipe(
        take(1),
        concatMap(([ layers, wmsLayers, applicationId, resolutions ]) => {
          if (!applicationId || (layers.length === 0 && wmsLayers.length === 0)) {
            return of([]);
          }
          const featureRequests$ = [
            ...layers.map(layer => this.getFeatureInfoFromApi$(layer, coordinates, applicationId, resolutions)),
            ...wmsLayers.map(layer => this.mapService.getFeatureInfoForLayers$(layer.id, coordinates, this.httpService).pipe(
              map(features => this.featuresToFeatureInfoResponseModel(features, layer.id)),
            )),
          ];
          return forkJoin(featureRequests$);
        }),
      );
  }

  public getEditableFeatures$(coordinates: [ number, number ], selectedLayer?: string | null): Observable<FeatureInfoResponseModel[]> {
    return combineLatest([
      this.store$.select(selectEditableLayers),
      this.store$.select(selectViewerId),
      this.mapService.getMapViewDetails$(),
      this.mapService.getProjectionCode$(),
    ])
      .pipe(
        take(1),
        concatMap(([ editableLayers, applicationId, resolutions, projection ]) => {
          const layers = editableLayers.filter(layer => {
            return !selectedLayer || layer.id === selectedLayer;
          });
          if (!applicationId || layers.length === 0) {
            return of([]);
          }
          const featureRequests$ = layers
              .map(layer => this.getFeatureInfoFromApi$(layer, coordinates, applicationId, resolutions, projection));
          return forkJoin(featureRequests$);
        }),
      );
  }

  private getFeatureInfoFromApi$(
    layer: ExtendedAppLayerModel,
    coordinates: [ number, number ],
    applicationId: string,
    resolutions: MapViewDetailsModel,
  ): Observable<FeatureInfoResponseModel> {
    const layerId = layer.id;
    return this.apiService.getFeatures$({
      layerId,
      applicationId,
      x: coordinates[0],
      y: coordinates[1],
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

  private featuresToFeatureInfoResponseModel(features: FeatureModel[], layerId: string): FeatureInfoResponseModel {
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
