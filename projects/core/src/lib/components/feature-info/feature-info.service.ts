import { inject, Injectable } from '@angular/core';
import {
  AttributeType, FeaturesResponseModel, TAILORMAP_API_V1_SERVICE, FeatureModel, ApiHelper, HiddenLayerFunctionality,
} from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectViewerId } from '../../state/core.selectors';
import { catchError, combineLatest, concatMap, forkJoin, map, mergeMap, Observable, of, take, tap } from 'rxjs';
import { FeatureInfoResponseModel } from './models/feature-info-response.model';
import {
  selectEditableLayers, selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes,
} from '../../map/state/map.selectors';
import { MapService, MapViewDetailsModel } from '@tailormap-viewer/map';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FilterService } from '../../filter/services/filter.service';
import { FeatureInfoLayerModel } from './models/feature-info-layer.model';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { loadFeatureInfo } from './state/feature-info.actions';

@Injectable({
  providedIn: 'root',
})
export class FeatureInfoService {

  public static LOAD_FEATURE_INFO_ERROR = $localize `:@@core.feature-info.error-loading-features:Could not load feature info`;

  /**
   * default buffer distance for feature info requests in pixels.
   */
  private static DEFAULT_DISTANCE = 10;

  private store$ = inject(Store);
  private mapService = inject(MapService);
  private httpService = inject(HttpClient);
  private apiService = inject(TAILORMAP_API_V1_SERVICE);
  private filterService = inject(FilterService);

  public fetchFeatures$(mapCoordinates: [number, number], mouseCoordinates: [number, number]): Observable<FeatureInfoResponseModel | null> {
    return combineLatest([
      this.store$.select(selectVisibleLayersWithAttributes),
      this.store$.select(selectVisibleWMSLayersWithoutAttributes),
      this.store$.select(selectViewerId),
      this.mapService.getMapViewDetails$(),
    ])
      .pipe(
        take(1),
        tap(([ layers, wmsLayers ]) => {
          const featureInfoLayers = [ ...layers, ...wmsLayers ]
            .filter(l => !l.hiddenFunctionality?.includes(HiddenLayerFunctionality.featureInfo))
            .sort((l1, l2) => l1.title.localeCompare(l2.title))
            .map<FeatureInfoLayerModel>(l => ({
              id: l.id,
              title: l.title,
              loading: LoadingStateEnum.LOADING,
            }));
          this.store$.dispatch(loadFeatureInfo({ mapCoordinates, mouseCoordinates, layers: featureInfoLayers }));
        }),
        mergeMap(([ layers, wmsLayers, viewerId, mapViewDetails ]) => {
          if (!viewerId) {
            return [];
          }
          const requests$ = [
            ...layers.map(l => this.getFeatureInfoFromApi$(l.id, mapCoordinates, viewerId, mapViewDetails)),
            ...wmsLayers.map(l => this.getWmsGetFeatureInfo$(l.id, mapCoordinates)),
          ];
          if (requests$.length === 0) {
            return [of(null)];
          }
          return requests$;
        }),
        mergeMap(featureInfoRequests$ => featureInfoRequests$),
      );
  }

  public getEditableFeatures$(coordinates: [ number, number ], selectedLayer?: string | null): Observable<FeatureInfoResponseModel[]> {
    return combineLatest([
      this.store$.select(selectEditableLayers),
      this.store$.select(selectViewerId),
      this.mapService.getMapViewDetails$(),
    ])
      .pipe(
        take(1),
        concatMap(([ editableLayers, applicationId, resolutions ]) => {
          const layers = editableLayers.filter(layer => {
            return !selectedLayer || layer.id === selectedLayer;
          });
          if (!applicationId || layers.length === 0) {
            return of([]);
          }
          const featureRequests$ = layers
              .map(layer => this.getFeatureInfoFromApi$( layer.id, coordinates, applicationId, resolutions,  true ));
          return forkJoin(featureRequests$);
        }),
      );
  }

  public getWmsGetFeatureInfo$(
    layerId: string,
    coordinates: [ number, number ],
  ): Observable<FeatureInfoResponseModel> {
    return this.mapService.getFeatureInfoForLayers$(layerId, coordinates, this.httpService)
      .pipe(map(response => {
        if (ApiHelper.isApiErrorResponse(response)) {
          return {
            features: [],
            error: response.message,
            layerId,
            columnMetadata: [],
          };
        }
        return this.featuresToFeatureInfoResponseModel(response, layerId);
      }));
  }

  public getFeatureInfoFromApi$(
    layerId: string,
    coordinates: [ number, number ],
    applicationId: string,
    resolutions: MapViewDetailsModel,
    geometryInAttributes=false,
  ): Observable<FeatureInfoResponseModel> {
    const layerFilter = this.filterService.getFilterForLayer(layerId);
    return this.apiService.getFeatures$({
      layerId,
      applicationId,
      x: coordinates[0],
      y: coordinates[1],
      // meters per pixel * fixed value
      distance: resolutions.resolution * FeatureInfoService.DEFAULT_DISTANCE,
      simplify: false,
      geometryInAttributes: geometryInAttributes,
      filter: layerFilter,
    }).pipe(
      map((featureInfoResult: FeaturesResponseModel): FeatureInfoResponseModel => ({
        features: (featureInfoResult.features || []).map(feature => ({ ...feature, layerId })),
        columnMetadata: (featureInfoResult.columnMetadata || []).map(metadata => ({ ...metadata, layerId })),
        template: featureInfoResult.template,
        layerId,
      })),
      catchError((response: HttpErrorResponse): Observable<FeatureInfoResponseModel> => {
        const error = response.error?.message ? response.error.message : null;
        return of({
          features: [],
          columnMetadata: [],
          template: null,
          layerId,
          error: error || FeatureInfoService.LOAD_FEATURE_INFO_ERROR,
        });
      }),
    );
  }

  private featuresToFeatureInfoResponseModel(features: FeatureModel[], layerId: string): FeatureInfoResponseModel {
    const columnMetadata = Object.keys(features.length > 0 ? features[0].attributes : {}).map(key => ({
      layerId,
      type: AttributeType.STRING,
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
