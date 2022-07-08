import { Injectable, NgZone } from '@angular/core';
import { OpenLayersMap } from '../openlayers-map/openlayers-map';
import { combineLatest, concatMap, finalize, map, Observable, Subject, tap } from 'rxjs';
import {
  LayerManagerModel, LayerTypesEnum, MapResolutionModel, MapStyleModel, MapViewerOptionsModel, ToolConfigModel, ToolModel, VectorLayerModel,
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
import { default as OlMap } from 'ol/Map';
import { $localize } from '@angular/localize/init';

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

  public renderFeatures$<T extends FeatureModelAttributes = FeatureModelAttributes>(
    layerId: string,
    featureGeometry$: Observable<FeatureModelType<T> | Array<FeatureModelType<T>>>,
    vectorLayerStyle?: MapStyleModel | ((feature: FeatureModel<T>) => MapStyleModel),
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
          FeatureHelper.getFeatures(featureGeometry).forEach(feature => {
            vectorLayer.getSource()?.addFeature(feature);
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
  public getUnitsOfMeasure$(): Observable<MapUnitEnum> {
    return this.map.getProjection$().pipe( map(
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
   *
   * @param width Width of the image in millimeters.
   * @param height Height of the image in millimeters
   * @param resolution Dots-per-inch of the image - the pixel resolution is width times DPI divided by 25.4 to convert inches to millimeters.
   */
  public createImageExport(width: number, height: number, resolution: number): Observable<string> {
    // Adapted from https://github.com/openlayers/openlayers/blob/master/examples/export-pdf.js

    return this.map.getMap$().pipe(
      concatMap((olMap: OlMap) => {
        // Save values to restore after printing
        const originalSize = olMap.getSize();
        const viewResolution = olMap.getView().getResolution();

        if (!originalSize || !viewResolution) {
          throw new Error('Map has no size or resolution');
        }

        // Calculate map size in mm for PDF. Pixels times dots-per-inch to mm. 1 inch is 25.4 mm
        width = Math.round((width * resolution) / 25.4);
        height = Math.round((height * resolution) / 25.4);

        const renderedMapCanvasDataURL$ = new Subject<string>();
        olMap.once('rendercomplete', () => {
          try {
            const mapCanvas = document.createElement('canvas');
            mapCanvas.width = width;
            mapCanvas.height = height;
            const mapContext = mapCanvas.getContext('2d');
            if (!mapContext) {
              throw new Error('map canvas 2D context is null');
            }
            const layerCanvasList = Array.from(document.querySelectorAll<HTMLCanvasElement>('.ol-layer canvas'));
            layerCanvasList.forEach(canvas => {
              MapService.addLayerToCanvas(canvas, mapContext);
            });
            renderedMapCanvasDataURL$.next(mapCanvas.toDataURL());
          } catch (e) {
            console.error(e);
            renderedMapCanvasDataURL$.error($localize `Unable to export map canvas to image: ${e}`);
          }
          // Reset original map size
          olMap.setSize(originalSize);
          olMap.getView().setResolution(viewResolution);
          renderedMapCanvasDataURL$.complete();
        });

        const printSize = [width, height];
        olMap.setSize(printSize);
        const scaling = Math.min(width / originalSize[0], height / originalSize[1]);
        olMap.getView().setResolution(viewResolution / scaling);

        return renderedMapCanvasDataURL$.asObservable();
      }),
    );
  }

  private static addLayerToCanvas(
    canvas: HTMLCanvasElement,
    mapContext: CanvasRenderingContext2D,
  ) {
    if (canvas.width > 0) {
      const opacity = (canvas.parentNode as HTMLDivElement).style.opacity;
      mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
      const transform = canvas.style.transform;
      // Get the transform parameters from the style's transform matrix
      // @ts-ignore
      const matrix = transform
        .match(/^matrix\(([^\(]*)\)$/)[1]
        .split(',')
        .map(Number);
      // Apply the transform to the export map context
      // @ts-ignore
      CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
      mapContext.drawImage(canvas, 0, 0);
    }
  }
}
