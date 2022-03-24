import { Injectable, NgZone } from '@angular/core';
import { OpenLayersMap } from '../openlayers-map/openlayers-map';
import { combineLatest, finalize, map, Observable, tap } from 'rxjs';
import { LayerManagerModel, LayerTypesEnum, MapResolutionModel, MapViewerOptionsModel, ToolModel, VectorLayerModel, MapStyleModel } from '../models';
import { ToolManagerModel } from '../models/tool-manager.model';
import VectorLayer from 'ol/layer/Vector';
import Geometry from 'ol/geom/Geometry';
import VectorSource from 'ol/source/Vector';
import WKT from 'ol/format/WKT';
import Style from 'ol/style/Style';
import { MapStyleHelper } from '../helpers/map-style.helper';
import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import { OlMapStyleType } from '../models/ol-map-style.type';

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

  public createTool$(tool: ToolModel, enable?: boolean): Observable<[ ToolManagerModel, string ]> {
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
        map(manager => {
          const id = manager.addTool(tool);
          if (enable) {
            manager.enableTool(id);
          }
          return [ manager, id ];
        }),
      );
  }

  public createVectorLayer$(
    layer: VectorLayerModel,
    vectorLayerStyle?: MapStyleModel | OlMapStyleType,
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

  public highlightFeatures$(
    layerId: string,
    featureGeometry$: Observable<string | null>,
    vectorLayerStyle?: MapStyleModel | OlMapStyleType,
    highlightConfig?: { keepHighlightOnEmptyFeature?: boolean },
  ): Observable<VectorLayer<VectorSource<Geometry>> | null> {
    const wktFormatter = new WKT();
    return combineLatest([
      this.createVectorLayer$({ id: layerId, name: `${layerId} layer`, layerType: LayerTypesEnum.Vector, visible: true }, vectorLayerStyle),
      featureGeometry$,
    ])
      .pipe(
        tap(([ vectorLayer, featureGeometry ]) => {
          if (!vectorLayer) {
            return;
          }
          if (!featureGeometry && (highlightConfig && highlightConfig.keepHighlightOnEmptyFeature)) {
            return;
          }
          vectorLayer.getSource().getFeatures().forEach(feature => vectorLayer.getSource().removeFeature(feature));
          if (featureGeometry) {
            vectorLayer.getSource().addFeature(wktFormatter.readFeature(featureGeometry));
          }
        }),
        map(([ vectorLayer ]) => vectorLayer),
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
