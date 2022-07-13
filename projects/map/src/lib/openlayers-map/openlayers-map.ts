/* eslint-disable rxjs/finnish */
import { default as OlMap } from 'ol/Map';
import Projection from 'ol/proj/Projection';
import View  from 'ol/View';
import { NgZone } from '@angular/core';
import { defaults as defaultInteractions } from 'ol/interaction';
import { LayerManagerModel, MapResolutionModel, MapViewerModel, MapViewerOptionsModel } from '../models';
import { ProjectionsHelper } from '../helpers/projections.helper';
import { OpenlayersExtent } from '../models/extent.type';
import { OpenLayersLayerManager } from './open-layers-layer-manager';
import { BehaviorSubject, concatMap, filter, map, merge, Observable, Subject, take } from 'rxjs';
import { Size } from 'ol/size';
import { ToolManagerModel } from '../models/tool-manager.model';
import { OpenLayersToolManager } from './open-layers-tool-manager';
import { OpenLayersEventManager } from './open-layers-event-manager';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import TileLayer from 'ol/layer/Tile';
import { $localize } from '@angular/localize/init';

export class OpenLayersMap implements MapViewerModel {

  private map: BehaviorSubject<OlMap | null> = new BehaviorSubject<OlMap | null>(null);
  private layerManager: BehaviorSubject<LayerManagerModel | null> = new BehaviorSubject<LayerManagerModel | null>(null);
  private toolManager: BehaviorSubject<ToolManagerModel | null> = new BehaviorSubject<ToolManagerModel | null>(null);

  private readonly resizeObserver: ResizeObserver;
  private initialExtent: OpenlayersExtent = [];

  constructor(
    private ngZone: NgZone,
  ) {
    this.resizeObserver = new ResizeObserver(() => this.updateMapSize());
  }

  public initMap(options: MapViewerOptionsModel) {
    if (this.map.value && this.map.value.getView().getProjection().getCode() === options.projection) {
      // Do not re-create the map if the projection is the same as previous
      this.map.value.getView().getProjection().setExtent(options.maxExtent);
      if (options.initialExtent && options.initialExtent.length > 0) {
        this.map.value.getView().fit(options.initialExtent);
      }
      return;
    }

    ProjectionsHelper.initProjection(options.projection, options.projectionDefinition, options.projectionAliases);
    const projection = new Projection({
      code: options.projection,
      extent: options.maxExtent,
    });
    const resolutions = ProjectionsHelper.getResolutions(options.projection, options.maxExtent);

    const view = new View({
      projection,
      resolutions,
    });

    const olMap = new OlMap({
      controls: [],
      interactions: defaultInteractions({
        altShiftDragRotate: false,
        pinchRotate: false,
      }),
      view,
    });

    this.initialExtent = options.initialExtent && options.initialExtent.length > 0
      ? options.initialExtent
      : options.maxExtent;

    if (this.toolManager.value) {
      this.toolManager.value.destroy();
    }

    if (this.toolManager.value) {
      this.toolManager.value.destroy();
    }

    if (this.map.value) {
      this.map.value.dispose();
    }

    const layerManager = new OpenLayersLayerManager(olMap);
    layerManager.init();
    const toolManager = new OpenLayersToolManager(olMap, this.ngZone);
    OpenLayersEventManager.initEvents(olMap, this.ngZone);

    this.map.next(olMap);
    this.layerManager.next(layerManager);
    this.toolManager.next(toolManager);
  }

  public render(container: HTMLElement) {
    this.ngZone.runOutsideAngular(this._render.bind(this, container));
  }

  public getLayerManager$(): Observable<LayerManagerModel> {
    const isLayerManager = (item: LayerManagerModel | null): item is LayerManagerModel => item !== null;
    return this.layerManager.asObservable().pipe(filter(isLayerManager));
  }

  public getToolManager$(): Observable<ToolManagerModel> {
    const isToolManager = (item: ToolManagerModel | null): item is ToolManagerModel => item !== null;
    return this.toolManager.asObservable().pipe(filter(isToolManager));
  }

  public getVisibleExtent$(): Observable<OpenlayersExtent> {
    return this.getSize$().pipe(
      concatMap(size => this.getMap$().pipe(
        map(olMap => olMap.getView().calculateExtent(size)),
      )),
    );
  }

  public setZoomLevel(zoom: number) {
    this.executeMapAction(olMap => olMap.getView().setZoom(zoom));
  }

  public zoomIn() {
    this.executeMapAction(olMap => {
      olMap.getView().setZoom((olMap.getView().getZoom() || 0) + 1);
    });
  }

  public zoomOut() {
    this.executeMapAction(olMap => {
      olMap.getView().setZoom((olMap.getView().getZoom() || 0) - 1);
    });
  }

  public zoomToInitialExtent() {
    this.executeMapAction(olMap => {
      if (this.initialExtent && this.initialExtent.length > 0) {
        olMap.getView().fit(this.initialExtent);
      }
    });
  }

  public getMap$(): Observable<OlMap> {
    const isNotNullMap = (item: OlMap | null): item is OlMap => item !== null;
    return this.map.asObservable().pipe(filter(isNotNullMap));
  }

  public executeMapAction(fn: (olMap: OlMap) => void) {
    this.getMap$()
      .pipe(take(1))
      .subscribe(olMap => fn(olMap));
  }

  public getProjection$(): Observable<Projection> {
    return this.getMap$().pipe(map(olMap => olMap.getView().getProjection()));
  }

  public getPixelForCoordinates$(coordinates: [number, number]): Observable<[number, number] | null> {
    return merge(
      this.getMap$(),
      OpenLayersEventManager.onMapMove$().pipe(map(evt => evt.map)))
        .pipe(
          map(olMap => {
            const px = olMap.getPixelFromCoordinate(coordinates);
            if (!px) {
              return null;
            }
            return [px[0], px[1]];
          }),
        );
  }

  public getResolution$(): Observable<MapResolutionModel> {
    return merge(
      this.getMap$(),
      OpenLayersEventManager.onMapMove$().pipe(map(evt => evt.map)))
      .pipe(
        map(olMap => {
          const view = olMap.getView();
          return {
            zoomLevel: view.getZoom() || 0,
            minZoomLevel: view.getMinZoom() || 0,
            maxZoomLevel: view.getMaxZoom() || 0,
            resolution: view.getResolution() || 0,
            minResolution: view.getMinResolution() || 0,
            maxResolution: view.getMaxResolution() || 0,
          };
        }),
      );
  }

  public exportMapImage$(widthInMm: number, heightInMm: number, resolution: number, debug: (msg: string) => void): Observable<string> {
    return this.getMap$().pipe(
      take(1),
      concatMap((olMap: OlMap) => {
        const originalSize = olMap.getSize();
        const viewResolution = olMap.getView().getResolution();
        const originalPixelRatio = (olMap as any).pixelRatio_;

        if (!originalSize || !viewResolution) {
          throw new Error('Map has no size or resolution');
        }

        const extent = olMap.getView().calculateExtent(originalSize);
        debug(`Map image export, original OL size: ${originalSize?.[0]} x ${originalSize?.[1]} px ` +
          `(width/height ratio: ${(originalSize?.[0] / originalSize?.[1]).toFixed(1)}, ` +
          `pixelRatio: ${originalPixelRatio}), view resolution: ${viewResolution?.toFixed(3)}, ` +
          `extent: ${extent.map(n => n.toFixed(3))}`);

        // Calculate map image size in pixels. Size in mm times resolution converted from inches to mm. 1 inch is 25.4 mm.
        const width = Math.round(widthInMm * resolution / 25.4);
        const height = Math.round(heightInMm * resolution / 25.4);
        debug(`Map image export, requested size in mm: ${widthInMm} x ${heightInMm} in ${resolution} DPI, ${width} x ${height} px, ` +
          `width/height ratio ${(width / height).toFixed(1)}`);

        const imageSize = [width, height];
        // The ratio of the export image pixel size to the original map pixel size based on width
        const sizeRatio = imageSize[0] / originalSize[0];
        (olMap as any).pixelRatio_ = sizeRatio;
        // When sizeRatio is higher than 1 reduce the map size, but get the higher pixel density image from the OL canvases because sizeRatio
        // is used as OL pixelRatio
        const imageExportOlSize = [imageSize[0]/sizeRatio, imageSize[1]/sizeRatio];

        const target = document.createElement('div');
        target.style.position = 'absolute';
        target.style.top = '0';
        target.style.left = '0';
        target.style.visibility = 'hidden';
        target.style.width = `${imageExportOlSize[0]}px`;
        target.style.height = `${imageExportOlSize[1]}px`;
        document.body.append(target);

        const imageExportOlMap = new OlMap({
          controls: [],
          interactions: [],
          target,
          layers: olMap.getLayers(),
          pixelRatio: sizeRatio,
          view: new View({
            projection: olMap.getView().getProjection(),
            resolutions: olMap.getView().getResolutions(),
            center: olMap.getView().getCenter(),
            resolution: viewResolution,
          }),
        })

        const imageExportExtent = olMap.getView().calculateExtent(olMap.getSize());
        // @ts-ignore
        debug(`Map image export OL size set to ${olMap.getSize()[0]} x ${olMap.getSize()[1]} px, ` +
          `pixelRatio ${(olMap as any).pixelRatio_.toFixed(3)}, view extent ${imageExportExtent.map(n => n.toFixed(3))}`);

        const clearCache = (l: BaseLayer) => {
          if (l instanceof LayerGroup) {
            l.getLayers().forEach(clearCache);
          }
          if (l instanceof TileLayer) {
            l.getSource().clear();
          }
        };
        // Clear tile layer caches, needed when rendering with a different pixelRatio
        olMap.getLayers().forEach(clearCache);

        const renderedMapCanvasDataURL$ = new Subject<string>();
        imageExportOlMap.once('rendercomplete', () => {
          try {
            const imageExportCanvas = document.createElement('canvas');
            imageExportCanvas.width = width;
            imageExportCanvas.height = height;
            const mapContext = imageExportCanvas.getContext('2d');
            if (!mapContext) {
              throw new Error('canvas 2D context is null');
            }
            const layerCanvasList = Array.from((imageExportOlMap.getTarget() as HTMLElement).querySelectorAll<HTMLCanvasElement>('.ol-layer canvas'));
            layerCanvasList.forEach(canvas => {
              OpenLayersMap.drawOlCanvasOnImageExportCanvas(canvas, mapContext, width);
            });
            renderedMapCanvasDataURL$.next(imageExportCanvas.toDataURL());
          } catch (e) {
            console.error(e);
            renderedMapCanvasDataURL$.error($localize `Unable to export map canvas to image: ${e}`);
          }

          renderedMapCanvasDataURL$.complete();

          olMap.getLayers().forEach(clearCache);
          olMap.render();

          imageExportOlMap.dispose();
          document.body.removeChild(target);
        });

        imageExportOlMap.setSize(imageExportOlSize);
        imageExportOlMap.render();

        return renderedMapCanvasDataURL$.asObservable();
      }),
    );
  }

  private static drawOlCanvasOnImageExportCanvas(
    olCanvas: HTMLCanvasElement,
    mapExportContext: CanvasRenderingContext2D,
    mapExportWidth: number,
  ) {
    if (olCanvas.width > 0) {
      const opacity = (olCanvas.parentNode as HTMLDivElement).style.opacity;
      mapExportContext.globalAlpha = opacity === '' ? 1 : Number(opacity);

      // An OL canvas will have a CSS transform on it to make it fit the OL target element size. This can reduce a higher pixel density
      // canvas (when pixelRatio > 1) to the CSS pixel size of the OL target element. Draw the original high density canvas to our map
      // export canvas.

      // For tile layers, an OL canvas will have an image with a map resolution of the tile grid and a transform to make it fit the OL
      // target size. For those canvases set a transform on our map export canvas to scale it properly.

      const ratio = mapExportWidth / olCanvas.width;
      mapExportContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      mapExportContext.drawImage(olCanvas, 0, 0);
    }
  }

  private getSize$(): Observable<Size> {
    return this.getMap$().pipe(map(olMap => {
      const size = olMap.getSize();
      if (!size) {
        return [ 0, 0 ];
      }
      return size;
    }));
  }

  private _render(container: HTMLElement) {
    this.executeMapAction(olMap => {
      olMap.setTarget(container);
      olMap.render();
      if (this.initialExtent && this.initialExtent.length > 0) {
        olMap.getView().fit(this.initialExtent);
      }
      window.setTimeout(() => this.updateMapSize(), 0);
      this.resizeObserver.observe(container);
    });
  }

  private updateMapSize() {
    this.executeMapAction(olMap => {
      olMap.updateSize();
    });
  }
}
