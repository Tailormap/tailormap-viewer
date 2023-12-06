import { Injectable, NgZone } from '@angular/core';
import { OpenLayersMap } from '../openlayers-map/openlayers-map';
import { combineLatest, finalize, map, Observable, take, tap } from 'rxjs';
import {
  LayerManagerModel, LayerModel, LayerTypesEnum, MapStyleModel, MapViewDetailsModel, MapViewerOptionsModel, OpenlayersExtent,
  ToolConfigModel, ToolModel,
  VectorLayerModel,
} from '../models';
import { ToolManagerModel } from '../models/tool-manager.model';
import { Vector as VectorLayer } from 'ol/layer';
import { Geometry } from 'ol/geom';
import { Vector as VectorSource } from 'ol/source';
import { MapStyleHelper } from '../helpers/map-style.helper';
import { MapTooltipModel } from '../models/map-tooltip.model';
import { OpenLayersMapTooltip } from '../openlayers-map/open-layers-map-tooltip';
import { FeatureModelType } from '../models/feature-model.type';
import { FeatureHelper } from '../helpers/feature.helper';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { MapSizeHelper } from '../helpers/map-size.helper';
import { MapUnitEnum } from '../models/map-unit.enum';
import { Layer } from 'ol/layer';
import { Source } from 'ol/source';
import { default as LayerRenderer } from 'ol/renderer/Layer';
import { Coordinate } from 'ol/coordinate';
import { HttpClient, HttpXsrfTokenExtractor } from '@angular/common/http';
import { Feature } from 'ol';

export type OlLayerFilter = (layer: Layer<Source, LayerRenderer<any>>) => boolean;

export interface MapExportOptions {
  widthInMm: number;
  heightInMm: number;
  dpi: number;
  extent?: OpenlayersExtent | null;
  center?: Coordinate;
  layers: LayerModel[];
  vectorLayerFilter?: OlLayerFilter;
}

@Injectable({
  providedIn: 'root',
})
export class MapService {

  private readonly map: OpenLayersMap;

  constructor(
    private ngZone: NgZone,
    private httpXsrfTokenExtractor: HttpXsrfTokenExtractor,
  ) {
    this.map = new OpenLayersMap(this.ngZone, this.httpXsrfTokenExtractor);
  }

  public initMap(options: MapViewerOptionsModel) {
    this.map.initMap(options);
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
  ): Observable<VectorLayer<VectorSource<Feature<Geometry>>> | null> {
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
          const vectorLayer = manager.addLayer<VectorLayer<VectorSource<Feature<Geometry>>>>(layer);
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
    zoomToFeature?: boolean | (() => boolean),
    updateWhileAnimating?: boolean,
  ): Observable<VectorLayer<VectorSource<Feature<Geometry>>> | null> {
    return combineLatest([
      this.createVectorLayer$({ id: layerId, name: `${layerId} layer`, layerType: LayerTypesEnum.Vector, visible: true, updateWhileAnimating }, vectorLayerStyle),
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
          const shouldZoom = typeof zoomToFeature === 'boolean'
            ? zoomToFeature
            : (typeof zoomToFeature === 'undefined' ? false : zoomToFeature());
          if (shouldZoom) {
            this.map.zoomToFeatures(featureModels);
          }
        }),
        map(([vectorLayer]) => vectorLayer),
      );
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
  ): Observable<FeatureModel[]> {
    return this.map.getFeatureInfoForLayers$(layerId, coordinates, httpService);
  }

  public setPadding(padding: number[]) {
    this.map.setPadding(padding);
  }

}
