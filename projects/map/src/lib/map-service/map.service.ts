import { Injectable, NgZone } from '@angular/core';
import { OpenLayersMap } from '../openlayers-map/openlayers-map';
import { combineLatest, finalize, map, Observable, tap } from 'rxjs';
import {
  LayerManagerModel, LayerTypesEnum, MapResolutionModel, MapViewerOptionsModel, ToolConfigModel, VectorLayerModel, MapStyleModel, ToolModel,
} from '../models';
import { ToolManagerModel } from '../models/tool-manager.model';
import VectorLayer from 'ol/layer/Vector';
import Geometry from 'ol/geom/Geometry';
import VectorSource from 'ol/source/Vector';
import WKT from 'ol/format/WKT';
import { MapStyleHelper } from '../helpers/map-style.helper';
import { OlMapStyleType } from '../models/ol-map-style.type';
import { MapTooltipModel } from '../models/map-tooltip.model';
import { OpenLayersMapTooltip } from '../openlayers-map/open-layers-map-tooltip';
import Feature from 'ol/Feature';
import { FeatureModelType } from '../models/feature-model.type';
import { FeatureHelper } from '../helpers/feature.helper';
import { FeatureModel } from '@tailormap-viewer/api';

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

  public createTool$<T extends ToolModel, C extends ToolConfigModel>(tool: C): Observable<T | null> {
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
        map(manager => manager.addTool<T, C>(tool)),
        tap(createdTool => toolId = createdTool?.id || ''),
      );
  }

  public createVectorLayer$(
    layer: VectorLayerModel,
    vectorLayerStyle?: MapStyleModel | ((feature: FeatureModel) => MapStyleModel),
  ): Observable<VectorLayer<VectorSource<Geometry>> | null> {
    let layerManager: LayerManagerModel;
    return this.getLayerManager$()
      .pipe(
        tap(manager => layerManager = manager),
        finalize(() => {
          if (!!layerManager) {
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

  public renderFeatures$(
    layerId: string,
    featureGeometry$: Observable<FeatureModelType | Array<FeatureModelType>>,
    vectorLayerStyle?: MapStyleModel | ((feature: FeatureModel) => MapStyleModel),
  ): Observable<VectorLayer<VectorSource<Geometry>> | null> {
    return combineLatest([
      this.createVectorLayer$({ id: layerId, name: `${layerId} layer`, layerType: LayerTypesEnum.Vector, visible: true }, vectorLayerStyle),
      featureGeometry$,
    ])
      .pipe(
        tap(([ vectorLayer, featureGeometry ]) => {
          if (!vectorLayer || !featureGeometry) {
            return;
          }
          vectorLayer.getSource().getFeatures().forEach(feature => vectorLayer.getSource().removeFeature(feature));
          FeatureHelper.getFeatures(featureGeometry).forEach(feature => {
            vectorLayer.getSource().addFeature(feature);
          });
        }),
        map(([ vectorLayer ]) => vectorLayer),
      );
  }

  public createTooltip$(): Observable<MapTooltipModel> {
    let tooltip: MapTooltipModel;
    return this.map.getMap$()
      .pipe(
        finalize(() => {
          if (!!tooltip) {
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

  public getPixelForCoordinates$(coordinates: [ number, number ]): Observable<[ number, number ] | null> {
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
  public getUnitsOfMeasure$(): Observable<string> {
    return this.map.getProjection$().pipe( map(
      p => ((p.getUnits()) === undefined ? 'm' : p.getUnits()).toLowerCase()),
    );
  }

  public getRoundedCoordinates$(coordinates: [number, number]) {
    return this.getUnitsOfMeasure$()
      .pipe(
        map(uom => {
          switch (uom) {
            case 'm': return 2;
            case 'ft': return 3;
            case 'us-ft': return 3;
            case 'degrees': return 6;
            default: return 4;
          }
        }),
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

}
