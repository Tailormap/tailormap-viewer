import { Injectable, NgZone } from '@angular/core';
import { OpenLayersMap } from '../openlayers-map/openlayers-map';
import { CesiumLayerManager } from '../cesium-map/cesium-layer-manager';
import { BehaviorSubject, combineLatest, filter, finalize, map, Observable, take, tap } from 'rxjs';
import {
  LayerManagerModel, LayerModel, LayerTypesEnum, MapStyleModel, MapViewDetailsModel, MapViewerOptionsModel, OpenlayersExtent,
  ToolConfigModel, ToolModel,
  VectorLayerModel,
} from '../models';
import { ToolManagerModel } from '../models/tool-manager.model';
import { Vector as VectorLayer } from 'ol/layer';
import { MapStyleHelper } from '../helpers/map-style.helper';
import { MapTooltipModel } from '../models/map-tooltip.model';
import { OpenLayersMapTooltip } from '../openlayers-map/open-layers-map-tooltip';
import { FeatureModelType } from '../models/feature-model.type';
import { FeatureHelper } from '../helpers/feature.helper';
import { ErrorResponseModel, FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { MapSizeHelper } from '../helpers/map-size.helper';
import { MapUnitEnum } from '../models/map-unit.enum';
import { Layer } from 'ol/layer';
import { Source } from 'ol/source';
import { default as LayerRenderer } from 'ol/renderer/Layer';
import { Coordinate } from 'ol/coordinate';
import { Geometry } from 'ol/geom';
import { Feature } from 'ol';
import { HttpClient, HttpXsrfTokenExtractor } from '@angular/common/http';

export type OlLayerFilter = (layer: Layer<Source, LayerRenderer<any>>) => boolean;

export interface MapExportOptions {
  widthInMm: number;
  heightInMm: number;
  dpi: number;
  extent?: OpenlayersExtent | null;
  center?: Coordinate;
  layers: LayerModel[];
  backgroundLayers: LayerModel[];
  vectorLayerFilter?: OlLayerFilter;
}

@Injectable({
  providedIn: 'root',
})
export class MapService {

  private readonly map: OpenLayersMap;
  private map3D: BehaviorSubject<CesiumLayerManager | null> = new BehaviorSubject<CesiumLayerManager | null>(null);
  private made3D: boolean;

  constructor(
    private ngZone: NgZone,
    private httpXsrfTokenExtractor: HttpXsrfTokenExtractor,
  ) {
    this.map = new OpenLayersMap(this.ngZone, this.httpXsrfTokenExtractor);
    this.made3D = false;
  }

  public initMap(options: MapViewerOptionsModel, initialOptions?: { initialCenter?: [number, number]; initialZoom?: number }) {
    this.map.initMap(options, initialOptions);
  }

  public render(el: HTMLElement) {
    this.map.render(el);
  }

  public refreshLayer(layerId: string) {
    this.getLayerManager$().pipe(take(1))
      .subscribe(manager => {
        manager.refreshLayer(layerId);
      });
  }

  public getLayerManager$(): Observable<LayerManagerModel> {
    return this.map.getLayerManager$();
  }

  public getToolManager$(): Observable<ToolManagerModel> {
    return this.map.getToolManager$();
  }

  public createTool$<T extends ToolModel, C extends ToolConfigModel>(tool: C): Observable<{ tool: T; manager: ToolManagerModel }> {
    let toolManager: ToolManagerModel;
    let toolId: string;
    return this.getToolManager$()
      .pipe(
        tap(manager => toolManager = manager),
        finalize(() => {
          if (!!toolId && !!toolManager) {
            toolManager.removeTool(toolId);
          }
        }),
        map(manager => ({ tool: manager.addTool<T, C>(tool), manager })),
        tap(({ tool: createdTool }) => toolId = createdTool?.id || ''),
      );
  }

  public createVectorLayer$<T extends FeatureModelAttributes = FeatureModelAttributes>(
    layer: VectorLayerModel,
    vectorLayerStyle?: MapStyleModel | ((feature: FeatureModel<T>) => MapStyleModel),
  ): Observable<VectorLayer<Feature<Geometry>> | null> {
    let layerManager: LayerManagerModel;
    return this.getLayerManager$()
      .pipe(
        tap(manager => layerManager = manager),
        finalize(() => {
          if (layerManager) {
            layerManager.removeLayer(layer.id);
          }
        }),
        map(manager => {
          const vectorLayer = manager.addLayer<VectorLayer<Feature<Geometry>>>(layer);
          if (vectorLayer) {
            vectorLayer.setStyle(MapStyleHelper.getStyle(vectorLayerStyle));
          }
          return vectorLayer;
        }),
      );
  }

  public renderFeatures$<T extends FeatureModelAttributes = FeatureModelAttributes>(
    layerId: string,
    featureGeometry$: Observable<FeatureModelType<T> | Array<FeatureModelType<T>>>,
    vectorLayerStyle?: MapStyleModel | ((feature: FeatureModel<T>) => MapStyleModel),
    config?: {
      zoomToFeature?: boolean | (() => boolean);
      centerFeature?: boolean | (() => boolean);
      updateWhileAnimating?: boolean;
    },
  ): Observable<VectorLayer<Feature<Geometry>> | null> {
    return combineLatest([
      this.createVectorLayer$({
        id: layerId,
        name: `${layerId} layer`,
        layerType: LayerTypesEnum.Vector,
        visible: true,
        updateWhileAnimating: config?.updateWhileAnimating,
      }, vectorLayerStyle),
      featureGeometry$,
    ])
      .pipe(
        tap(([ vectorLayer, featureGeometry ]) => {
          if (!vectorLayer) {
            return;
          }
          vectorLayer.getSource()?.getFeatures().forEach(feature => {
            vectorLayer.getSource()?.removeFeature(feature);
          });
          const featureModels = FeatureHelper.getFeatures(featureGeometry, vectorLayer.getSource()?.getProjection()?.getCode());
          featureModels.forEach(feature => {
            vectorLayer.getSource()?.addFeature(feature);
          });
          const shouldZoom = this.getBoolean(config?.zoomToFeature);
          const shouldCenter = this.getBoolean(config?.centerFeature);
          if (shouldZoom) {
            this.map.zoomToFeatures(featureModels);
          } else if (shouldCenter) {
            this.map.centerFeatures(featureModels);
          }
        }),
        map(([vectorLayer]) => vectorLayer),
      );
  }

  private getBoolean(bool?: boolean | (() => boolean)) {
    return typeof bool === 'boolean'
      ? bool
      : (typeof bool === 'undefined' ? false : bool());
  }

  public createTooltip$(): Observable<MapTooltipModel> {
    let tooltip: MapTooltipModel;
    return this.map.getMap$()
      .pipe(
        finalize(() => {
          if (tooltip) {
            tooltip.destroy();
          }
        }),
        map(olMap => {
          if (tooltip) {
            tooltip.destroy();
          }
          tooltip = new OpenLayersMapTooltip(olMap);
          return tooltip;
        }),
      );
  }

  public getPixelForCoordinates$(coordinates: [number, number]): Observable<[number, number] | null> {
    return this.map.getPixelForCoordinates$(coordinates);
  }

  public getMapViewDetails$(): Observable<MapViewDetailsModel> {
    return this.map.getMapViewDetails$();
  }

  public getProjectionCode$(): Observable<string> {
    return this.map.getProjection$().pipe(map(p => p.getCode()));
  }

  /** Gets the UOM of the map as defined in the projection.
   * Will return 'm' in case the map's projection has not defined UOM (such as EPSG:28992).
   *
   * @see ol.proj.Units
   */
  public getUnitsOfMeasure$(): Observable<MapUnitEnum> {
    return this.map.getProjection$().pipe(map(
        p => p.getUnits() === undefined ? MapUnitEnum.m : p.getUnits().toLowerCase() as MapUnitEnum,
      ),
    );
  }

  public getRoundedCoordinates$(coordinates: [number, number]) {
    return this.getUnitsOfMeasure$()
      .pipe(
        map(MapSizeHelper.getCoordinatePrecision),
        map(decimals => coordinates.map(coord => coord.toFixed(decimals))),
      );
  }

  public zoomIn() {
    this.map.zoomIn();
  }

  public zoomOut() {
    this.map.zoomOut();
  }

  public zoomToInitialExtent() {
    this.map.zoomToInitialExtent();
  }

  public setCenterAndZoom(center: number[], zoom: number) {
      this.map.setCenterAndZoom(center, zoom);
  }

  public zoomTo(geometry: string, projectionCode: string) {
    this.getProjectionCode$()
      .pipe(take(1))
      .subscribe(mapProjection => {
        this.map.zoomToGeometry(FeatureHelper.fromWKT(geometry, projectionCode, mapProjection));
      });
  }

  /**
   * Export the current map to an image.
   */
  public exportMapImage$(options: MapExportOptions): Observable<string> {
    return this.map.exportMapImage$(options);
  }

  public getFeatureInfoForLayers$(
    layerId: string,
    coordinates: [number, number],
    httpService: HttpClient,
  ): Observable<FeatureModel[] | ErrorResponseModel> {
    return this.map.getFeatureInfoForLayers$(layerId, coordinates, httpService);
  }

  public setPadding(padding: number[]) {
    this.map.setPadding(padding);
  }

  public getCesiumLayerManager$(): Observable<CesiumLayerManager> {
    const isLayerManager = (item: CesiumLayerManager | null): item is CesiumLayerManager => item !== null;
    return this.map3D.asObservable().pipe(filter(isLayerManager));
  }

  public executeCLMAction(fn: (cesiumLayerManager: CesiumLayerManager) => void) {
    this.getCesiumLayerManager$()
      .pipe(take(1))
      .subscribe(cesiumLayerManager => fn(cesiumLayerManager));
  }

  public make3D$(){
    if (!this.made3D) {
      this.map.executeMapAction(olMap => {
        this.map3D.next(new CesiumLayerManager(olMap, this.ngZone));
      });
      this.executeCLMAction(cesiumLayerManager => {
        cesiumLayerManager.init();
      });
      this.made3D = true;
    }
  }

  public switch3D$(){
    this.make3D$();
    this.executeCLMAction(cesiumLayerManager => {
      cesiumLayerManager.switch3D$();
    });
  }

}
