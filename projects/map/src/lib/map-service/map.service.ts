import { Injectable, NgZone } from '@angular/core';
import { OpenLayersMap } from '../openlayers-map/openlayers-map';
import { combineLatest, finalize, map, Observable, tap } from 'rxjs';
import {
  LayerManagerModel, LayerModel, LayerTypesEnum, MapResolutionModel, MapStyleModel, MapViewerOptionsModel, ToolConfigModel, ToolModel,
  VectorLayerModel,
} from '../models';
import { ToolManagerModel } from '../models/tool-manager.model';
import VectorLayer from 'ol/layer/Vector';
import Geometry from 'ol/geom/Geometry';
import VectorSource from 'ol/source/Vector';
import { MapStyleHelper } from '../helpers/map-style.helper';
import { MapTooltipModel } from '../models/map-tooltip.model';
import { OpenLayersMapTooltip } from '../openlayers-map/open-layers-map-tooltip';
import { FeatureModelType } from '../models/feature-model.type';
import { FeatureHelper } from '../helpers/feature.helper';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { MapSizeHelper } from '../helpers/map-size.helper';
import { MapUnitEnum } from '../models/map-unit.enum';

export interface MapExportOptions {
  widthInMm: number;
  heightInMm: number;
  resolution: number;
  layers: LayerModel[];
}

@Injectable({
  providedIn: 'root',
})
export class MapService {

  private readonly map: OpenLayersMap;

  constructor(
    private ngZone: NgZone,
  ) {
    this.map = new OpenLayersMap(this.ngZone);
  }

  public initMap(options: MapViewerOptionsModel) {
    this.map.initMap(options);
  }

  public render(el: HTMLElement) {
    this.map.render(el);
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
  ): Observable<VectorLayer<VectorSource<Geometry>> | null> {
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
          const vectorLayer = manager.addLayer<VectorLayer<VectorSource<Geometry>>>(layer);
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
    zoomToFeature?: boolean,
  ): Observable<VectorLayer<VectorSource<Geometry>> | null> {
    return combineLatest([
      this.createVectorLayer$({ id: layerId, name: `${layerId} layer`, layerType: LayerTypesEnum.Vector, visible: true }, vectorLayerStyle),
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
          const featureModels = FeatureHelper.getFeatures(featureGeometry);
          featureModels.forEach(feature => {
            vectorLayer.getSource()?.addFeature(feature);
          });
          if (zoomToFeature && featureModels.length === 1) {
            this.map.zoomToFeature(featureModels[0]);
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

  public getResolution$(): Observable<MapResolutionModel> {
    return this.map.getResolution$();
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

  /**
   * Export the current map to an image.
   */
  public exportMapImage$(options: MapExportOptions): Observable<string> {
    return this.map.exportMapImage$(options);
  }
}
