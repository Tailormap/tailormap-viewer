/* eslint-disable rxjs/finnish */
import { default as OlMap } from 'ol/Map';
import Projection from 'ol/proj/Projection';
import View from 'ol/View';
import { NgZone } from '@angular/core';
import { defaults as defaultInteractions } from 'ol/interaction';
import { LayerManagerModel, MapViewDetailsModel, MapViewerModel, MapViewerOptionsModel } from '../models';
import { ProjectionsHelper } from '../helpers/projections.helper';
import { OpenlayersExtent } from '../models/extent.type';
import { OpenLayersLayerManager } from './open-layers-layer-manager';
import { BehaviorSubject, concatMap, filter, forkJoin, map, merge, Observable, of, take } from 'rxjs';
import { Size } from 'ol/size';
import { ToolManagerModel } from '../models/tool-manager.model';
import { OpenLayersToolManager } from './open-layers-tool-manager';
import { OpenLayersEventManager } from './open-layers-event-manager';
import { MapExportOptions } from '../map-service/map.service';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import { buffer } from 'ol/extent';
import BaseLayer from 'ol/layer/Base';
import { OpenLayersWmsGetFeatureInfoHelper } from './helpers/open-layers-wms-get-feature-info.helper';
import { HttpClient } from '@angular/common/http';
import { FeatureModel } from '@tailormap-viewer/api';
import { OpenLayersMapImageExporter } from './openlayers-map-image-exporter';

export class OpenLayersMap implements MapViewerModel {

  private map: BehaviorSubject<OlMap | null> = new BehaviorSubject<OlMap | null>(null);
  private layerManager: BehaviorSubject<OpenLayersLayerManager | null> = new BehaviorSubject<OpenLayersLayerManager | null>(null);
  private toolManager: BehaviorSubject<ToolManagerModel | null> = new BehaviorSubject<ToolManagerModel | null>(null);

  private readonly resizeObserver: ResizeObserver;
  private initialExtent: OpenlayersExtent = [];
  private initialCenterZoom?: [number[], number] = undefined;

  constructor(
    private ngZone: NgZone,
  ) {
    this.resizeObserver = new ResizeObserver(() => this.updateMapSize());
  }

  public initMap(options: MapViewerOptionsModel) {
    if (this.map.value && this.map.value.getView().getProjection().getCode() === options.projection) {
      // Do not re-create the map if the projection is the same as previous
      this.map.value.getView().getProjection().setExtent(options.maxExtent);
      if (this.initialCenterZoom !== undefined) {
          this.map.value.getView().setCenter(this.initialCenterZoom[0]);
          this.map.value.getView().setZoom(this.initialCenterZoom[1]);
      } else if (options.initialExtent && options.initialExtent.length > 0) {
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

    const layerManager = new OpenLayersLayerManager(olMap, this.ngZone);
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

  public setCenterAndZoom(center: number[], zoom: number) {
      this.initialCenterZoom = [ center, zoom ];

      this.executeMapAction(olMap => {
          const view = olMap.getView();
          view.setCenter(center);
          view.setZoom(zoom);
      });
  }

  public zoomToFeature(olFeature: Feature<Geometry>) {
    this.zoomToGeometry(olFeature.getGeometry());
  }

  public zoomToGeometry(geom?: Geometry) {
    if (!geom) {
      return;
    }
    const geomExtent = geom.getExtent();
    this.executeMapAction(olMap => {
      olMap.getView().fit(buffer(geomExtent, 10), { duration: 1000 });
    });
  }

  public zoomTo(x: number, y: number, zoomLevel?: number, animationDuration = 1000, ignoreWhileAnimating = false) {
    this.executeMapAction(olMap => {
      if (olMap.getView().getAnimating() && ignoreWhileAnimating) {
        return;
      }
      zoomLevel = !(zoomLevel) || zoomLevel < 0 ? olMap.getView().getZoom() : zoomLevel;
      if (typeof zoomLevel === 'undefined') {
        return;
      }
      if (animationDuration === 0) {
        olMap.getView().setCenter([ x, y ]);
        olMap.getView().setZoom(zoomLevel);
      } else {
        olMap.getView().animate({ duration: animationDuration, zoom: zoomLevel, center: [ x, y ] });
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
            return [ px[0], px[1] ];
          }),
        );
  }

  public getMapViewDetails$(): Observable<MapViewDetailsModel> {
    return merge(
      this.getMap$(),
      OpenLayersEventManager.onMapMove$().pipe(map(evt => evt.map)))
      .pipe(
        map(olMap => {
          const view = olMap.getView();

          // From ImageWMS.getLegendUrl(), for conversion of resolution to scale
          const mpu = view.getProjection()
            ? view.getProjection().getMetersPerUnit()
            : 1;
          const pixelSize = 0.00028;
          const resolution = view.getResolution() || 0;
          const scale = (resolution * (mpu || 1)) / pixelSize;

          return {
            zoomLevel: view.getZoom() || 0,
            minZoomLevel: view.getMinZoom() || 0,
            maxZoomLevel: view.getMaxZoom() || 0,
            resolution,
            minResolution: view.getMinResolution() || 0,
            maxResolution: view.getMaxResolution() || 0,
            scale,
            size: olMap.getSize(),
            center: olMap.getView().getCenter(),
            extent: olMap.getView().getCenter() != null ? olMap.getView().calculateExtent(olMap.getSize()) : null,
          };
        }),
      );
  }

  public exportMapImage$(options: MapExportOptions): Observable<string> {
    return this.getMap$().pipe(
      take(1),
      concatMap((olMap: OlMap) => {
        const extraLayers: BaseLayer[] = olMap.getAllLayers().filter(l => options.vectorLayerFilter && options.vectorLayerFilter(l));
        return forkJoin([
          of(extraLayers),
          OpenLayersMapImageExporter.exportMapImage$(olMap.getSize() as Size, olMap.getView(), options, extraLayers),
        ]);
      }),
      map(([ extraLayers, pdfExport ]) => {
        // Force redraw of extra layers with normal DPI
        extraLayers.forEach(l => l.changed());
        return pdfExport;
      }),
    );
  }

  public getFeatureInfoForLayers$(
    layerId: string,
    coordinates: [number, number],
    httpClient: HttpClient,
  ): Observable<FeatureModel[]> {
    return forkJoin([
      this.layerManager.asObservable().pipe(
        filter((layerManager: OpenLayersLayerManager | null): layerManager is OpenLayersLayerManager => layerManager !== null),
        take(1),
      ),
      this.getMap$().pipe(take(1)),
    ])
      .pipe(
        concatMap(([ layerManager, olMap ]) => {
          return OpenLayersWmsGetFeatureInfoHelper.getFeatureInfoForLayer$(
            httpClient,
            layerId,
            coordinates,
            olMap.getView().getResolution() || 0,
            olMap.getView().getProjection().getCode(),
            layerManager,
          );
        }),
      );
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
      if (this.initialCenterZoom !== undefined) {
          olMap.getView().setCenter(this.initialCenterZoom[0]);
          olMap.getView().setZoom(this.initialCenterZoom[1]);
      } else if (this.initialExtent && this.initialExtent.length > 0) {
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
