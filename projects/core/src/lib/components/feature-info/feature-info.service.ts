import { inject, Injectable } from '@angular/core';
import {
  AttributeType, FeaturesResponseModel, TAILORMAP_API_V1_SERVICE, FeatureModel, ApiHelper, FeatureModelAttributes, HiddenLayerFunctionality,
  AppLayerModel,
} from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectViewerId } from '../../state/core.selectors';
import { selectEnabledFilterGroups } from '../../state/filter-state/filter.selectors';
import { catchError, combineLatest, concatMap, forkJoin, map, mergeMap, Observable, of, switchMap, take, tap } from 'rxjs';
import { emptyFeaturesResponse, FeatureInfoResponseModel } from './models/feature-info-response.model';
import {
  selectEditableLayers, selectLayer, selectLayers, selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes,
} from '../../map/state/map.selectors';
import { FeatureInfo3DModel, MapService, MapViewDetailsModel, ScaleHelper } from '@tailormap-viewer/map';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FilterService } from '../../filter/services/filter.service';
import { FeatureInfoLayerModel } from './models/feature-info-layer.model';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { loadFeatureInfo, updateFeatureInFeatureInfo } from './state/feature-info.actions';
import { FeatureInfoFeatureModel } from './models/feature-info-feature.model';
import { FeaturesFilterHelper } from '../../filter';
import { DataSourceManagerService } from '../../services/data-source-manager.service';
import { DataSourceLayerModel } from '../../models/data-source.model';

@Injectable({
  providedIn: 'root',
})
export class FeatureInfoService {

  public static LOAD_FEATURE_INFO_ERROR = $localize `:@@core.feature-info.error-loading-features:Could not load feature info`;

  /**
   * default buffer distance for feature info requests in pixels.
   */
  private static DEFAULT_DISTANCE = 10;
  private static TOUCH_DISTANCE = 30;

  private store$ = inject(Store);
  private mapService = inject(MapService);
  private httpService = inject(HttpClient);
  private apiService = inject(TAILORMAP_API_V1_SERVICE);
  private filterService = inject(FilterService);
  private dataSourceManager = inject(DataSourceManagerService);

  public fetchFeatures$(
    mapCoordinates: [number, number],
    mouseCoordinates: [number, number],
    cesiumFeatureInfo?: FeatureInfo3DModel,
    pointerType?: string,
  ): Observable<FeatureInfoResponseModel | null> {
    return combineLatest([
      this.store$.select(selectVisibleLayersWithAttributes),
      this.store$.select(selectVisibleWMSLayersWithoutAttributes),
      cesiumFeatureInfo?.layerId ? this.store$.select(selectLayer(cesiumFeatureInfo.layerId)) : of(null),
      this.mapService.getMapViewDetails$(),
      this.store$.select(selectViewerId),
      this.getFeatureInfoDataSourceLayers$(),
    ])
      .pipe(
        take(1),
        map(([ layers, wmsLayers, cesiumLayer, mapViewDetails, viewerId, dataSourceLayers ]) => {
          const isHidden = (l: AppLayerModel) => !!l.hiddenFunctionality?.includes(HiddenLayerFunctionality.featureInfo);
          const isFeatureInfoLayer = (l: AppLayerModel) => !isHidden(l) && ScaleHelper.isInScale(mapViewDetails.scale, l.minScale, l.maxScale);
          return {
            layers: layers.filter(isFeatureInfoLayer),
            wmsLayers: wmsLayers.filter(isFeatureInfoLayer),
            cesiumLayer: cesiumLayer && isFeatureInfoLayer(cesiumLayer) ? cesiumLayer : null,
            cesiumHidden: !!cesiumLayer && isHidden(cesiumLayer),
            mapViewDetails,
            viewerId,
            dataSourceLayers,
          };
        }),
        tap(({ layers, wmsLayers, cesiumLayer, dataSourceLayers }) => {
          const featureInfoLayers = [ ...layers, ...wmsLayers, ...(cesiumLayer ? [cesiumLayer] : []), ...dataSourceLayers ]
            .sort((l1, l2) => l1.title.localeCompare(l2.title))
            .map<FeatureInfoLayerModel>(l => ({
              id: l.id,
              title: l.title,
              loading: LoadingStateEnum.LOADING,
            }));
          this.store$.dispatch(loadFeatureInfo({ mapCoordinates, mouseCoordinates, layers: featureInfoLayers }));
        }),
        mergeMap(({ layers, wmsLayers, cesiumHidden, mapViewDetails, viewerId, dataSourceLayers }) => {
          if (!viewerId) {
            return [];
          }
          const requests$ = [
            ...layers.map(l => this.getFeatureInfoFromApi$(l.id, mapCoordinates, viewerId, mapViewDetails, false, pointerType)),
            ...wmsLayers.map(l => this.getWmsGetFeatureInfo$(l.id, mapCoordinates)),
            ...dataSourceLayers.map(l => this.getFeatureInfoFromDataSource$(l, mapCoordinates, viewerId, mapViewDetails, pointerType)),
          ];
          if (cesiumFeatureInfo && !cesiumHidden) {
            requests$.push(of(this.featureInfo3DToResponse(cesiumFeatureInfo)));
          }
          if (requests$.length === 0) {
            return [of(null)];
          }
          return requests$;
        }),
        mergeMap(featureInfoRequests$ => featureInfoRequests$),
      );
  }

  public getFeaturesForLayer$(
    coordinates: [ number, number ],
    selectedLayer: string | null,
    pointerType?: string,
    withAttachments = true,
  ): Observable<FeatureInfoResponseModel | null> {
    return combineLatest([
      this.store$.select(selectVisibleLayersWithAttributes),
      this.store$.select(selectVisibleWMSLayersWithoutAttributes),
      this.store$.select(selectViewerId),
      this.mapService.getMapViewDetails$(),
      this.getFeatureInfoDataSourceLayers$(),
    ])
      .pipe(
        take(1),
        switchMap(([ layers, wmsLayers, viewerId, mapViewDetails, dataSourceLayers ]) => {
          if (!viewerId) {
            return of(null);
          }
          if (layers.some(l => l.id === selectedLayer)) {
            return this.getFeatureInfoFromApi$(selectedLayer!, coordinates, viewerId, mapViewDetails, false, pointerType, withAttachments);
          } else if (wmsLayers.some(l => l.id === selectedLayer)) {
            return this.getWmsGetFeatureInfo$(selectedLayer!, coordinates);
          }
          const dataSourceLayer = dataSourceLayers.find(l => l.id === selectedLayer);
          if (dataSourceLayer) {
            return this.getFeatureInfoFromDataSource$(dataSourceLayer, coordinates, viewerId, mapViewDetails, pointerType);
          } else {
            return of(null);
          }
        }),
      );
  }

  public getEditableFeatures$(coordinates: [ number, number ], selectedLayer?: string | null, pointerType?: string): Observable<FeatureInfoResponseModel[]> {
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
              .map(layer => this.getFeatureInfoFromApi$( layer.id, coordinates, applicationId, resolutions,  true, pointerType ));
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
            ...emptyFeaturesResponse,
            error: response.message,
            layerId,
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
    geometryInAttributes = false,
    pointerType?: string,
    withAttachments = true,
  ): Observable<FeatureInfoResponseModel> {
    const layerFilter = this.filterService.getFilterForLayer(layerId);
    const distance = FeatureInfoService.getDistance(resolutions, pointerType);
    return this.apiService.getFeatures$({
      layerId,
      applicationId,
      x: coordinates[0],
      y: coordinates[1],
      distance: distance,
      simplify: false,
      geometryInAttributes: geometryInAttributes,
      withAttachments,
      filter: FeaturesFilterHelper.getFilter(layerFilter) || undefined,
    }).pipe(
      map(response => FeatureInfoService.featuresResponseToFeatureInfoResponse(response, layerId)),
      catchError((response: HttpErrorResponse) => of(FeatureInfoService.getErrorResponse(response, layerId))),
    );
  }

  /**
   * Maps a features response (backend API or data source) to a feature info response, tagging features and metadata with the layer id.
   */
  public static featuresResponseToFeatureInfoResponse(response: FeaturesResponseModel, layerId: string): FeatureInfoResponseModel {
    return {
      features: (response.features || []).map(feature => ({ ...feature, layerId })),
      columnMetadata: (response.columnMetadata || []).map(metadata => ({ ...metadata, layerId })),
      attachmentMetadata: (response.attachmentMetadata || []).map(metadata => ({ ...metadata, layerId })),
      template: response.template,
      layerId,
    };
  }

  private static getErrorResponse(response: HttpErrorResponse, layerId: string): FeatureInfoResponseModel {
    const error = response.error?.message ? response.error.message : null;
    return {
      ...emptyFeaturesResponse,
      layerId,
      error: error || FeatureInfoService.LOAD_FEATURE_INFO_ERROR,
    };
  }

  /**
   * Search distance in map units: meters per pixel * fixed number of pixels.
   */
  private static getDistance(resolutions: MapViewDetailsModel, pointerType?: string): number {
    return pointerType === 'touch'
      ? resolutions.resolution * FeatureInfoService.TOUCH_DISTANCE
      : resolutions.resolution * FeatureInfoService.DEFAULT_DISTANCE;
  }

  /**
   * Data source layers (non-backend, e.g. user layers) that have feature info enabled. When the layer is also in map state,
   * apply the same visibility, scale and hiddenFunctionality checks as for backend layers.
   */
  private getFeatureInfoDataSourceLayers$(): Observable<DataSourceLayerModel[]> {
    return combineLatest([
      this.dataSourceManager.featureInfoLayers$,
      this.store$.select(selectLayers),
      this.mapService.getMapViewDetails$(),
    ]).pipe(
      map(([ dataSourceLayers, appLayers, mapViewDetails ]) => dataSourceLayers.filter(layer => {
        const appLayer = appLayers.find(l => l.id === layer.id);
        return !appLayer || (appLayer.visible
          && !appLayer.hiddenFunctionality?.includes(HiddenLayerFunctionality.featureInfo)
          && ScaleHelper.isInScale(mapViewDetails.scale, appLayer.minScale, appLayer.maxScale));
      })),
    );
  }

  private getFeatureInfoFromDataSource$(
    layer: DataSourceLayerModel,
    coordinates: [ number, number ],
    applicationId: string,
    resolutions: MapViewDetailsModel,
    pointerType?: string,
  ): Observable<FeatureInfoResponseModel> {
    return this.store$.select(selectEnabledFilterGroups).pipe(
      take(1),
      switchMap(filterGroups => this.dataSourceManager.getFeatures$({
        applicationId,
        layerId: layer.id,
        layerName: layer.layerName,
        x: coordinates[0],
        y: coordinates[1],
        distance: FeatureInfoService.getDistance(resolutions, pointerType),
        filterGroups,
      })),
      map(response => FeatureInfoService.featuresResponseToFeatureInfoResponse(response, layer.id)),
      catchError((response: HttpErrorResponse) => of(FeatureInfoService.getErrorResponse(response, layer.id))),
    );
  }

  private featuresToFeatureInfoResponseModel(features: FeatureModel[], layerId: string): FeatureInfoResponseModel {
    const columnMetadata = Object.keys(features.length > 0 ? features[0].attributes : {}).map(name => ({
      layerId,
      type: AttributeType.STRING,
      name,
    }));
    return {
      features: features.map(feature => ({ ...feature, layerId })),
      columnMetadata,
      attachmentMetadata: [],
      layerId,
    };
  }

  private featureInfo3DToResponse(cesiumFeatureInfo: FeatureInfo3DModel): FeatureInfoResponseModel {
    const feature: FeatureInfoFeatureModel = {
      __fid: cesiumFeatureInfo.featureId.toString(),
      attributes: cesiumFeatureInfo.properties.reduce<FeatureModelAttributes>(
        (attributes, { id, value }) => ({ ...attributes, [id]: value }),
        {},
      ),
      layerId: cesiumFeatureInfo.layerId,
    };
    return {
      features: [feature],
      columnMetadata: cesiumFeatureInfo.columnMetadata,
      attachmentMetadata: [],
      layerId: cesiumFeatureInfo.layerId,
    };

  }

  public updateSingleFeature(featureId: string, layerId: string): void {
    this.store$.select(selectViewerId)
      .pipe(
        take(1),
        switchMap(viewerId => this.apiService.getFeatures$({
          applicationId: viewerId || '',
          layerId,
          __fid: featureId,
          withAttachments: true,
        })),
        catchError((response: HttpErrorResponse): Observable<FeatureInfoResponseModel> => {
          const error = response.error?.message ? response.error.message : null;
          return of({
            ...emptyFeaturesResponse,
            layerId,
            error: error || FeatureInfoService.LOAD_FEATURE_INFO_ERROR,
          });
        }),
        take(1),
      ).subscribe(featureInfoResponse => {
        if (featureInfoResponse.features.length === 1) {
          const feature = featureInfoResponse.features[0];
          const featureWithLayerId: FeatureInfoFeatureModel = { ...feature, layerId };
          this.store$.dispatch(updateFeatureInFeatureInfo({ feature: featureWithLayerId }));
        }
    });
  }
}
