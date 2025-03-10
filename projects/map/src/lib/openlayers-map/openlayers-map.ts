/* eslint-disable rxjs/finnish */
import { Map as OlMap } from 'ol';
import { Projection, get as getProjection } from 'ol/proj';
import { View } from 'ol';
import { NgZone } from '@angular/core';
import { defaults as defaultInteractions, DragPan, MouseWheelZoom } from 'ol/interaction';
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
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { buffer, Extent, extend, getCenter } from 'ol/extent';
import { Layer as BaseLayer } from 'ol/layer';
import { OpenLayersWmsGetFeatureInfoHelper } from './helpers/open-layers-wms-get-feature-info.helper';
import { HttpClient, HttpXsrfTokenExtractor } from '@angular/common/http';
import { ErrorResponseModel, FeatureModel } from '@tailormap-viewer/api';
import { OpenLayersMapImageExporter } from './openlayers-map-image-exporter';
import { Attribution } from 'ol/control';
import { mouseOnly, platformModifierKeyOnly } from 'ol/events/condition';
import { OpenLayersHelper } from './helpers/open-layers.helper';
import { CesiumLayerManager } from './cesium-map/cesium-layer-manager';

export class OpenLayersMap implements MapViewerModel {

  private map: BehaviorSubject<OlMap | null> = new BehaviorSubject<OlMap | null>(null);
  private layerManager: BehaviorSubject<OpenLayersLayerManager | null> = new BehaviorSubject<OpenLayersLayerManager | null>(null);
  private toolManager: BehaviorSubject<ToolManagerModel | null> = new BehaviorSubject<ToolManagerModel | null>(null);

  private map3D: BehaviorSubject<CesiumLayerManager | null> = new BehaviorSubject<CesiumLayerManager | null>(null);
  private made3D: boolean;
  private in3D: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private readonly resizeObserver: ResizeObserver;
  private initialExtent: OpenlayersExtent = [];
  private initialCenterZoom?: [number[], number] = undefined;
  private mapPadding: number[] | undefined;

  constructor(
    private ngZone: NgZone,
    private httpXsrfTokenExtractor: HttpXsrfTokenExtractor,
  ) {
    this.resizeObserver = new ResizeObserver(() => this.updateMapSize());
    this.made3D = false;
  }

  public initMap(options: MapViewerOptionsModel, initialOptions?: { initialCenter?: [number, number]; initialZoom?: number }) {
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

    if (typeof initialOptions?.initialCenter !== 'undefined' && typeof initialOptions?.initialZoom !== 'undefined') {
      this.initialCenterZoom = [ initialOptions.initialCenter, initialOptions.initialZoom ];
    }

    ProjectionsHelper.initProjection(options.projection, options.projectionDefinition, options.projectionAliases);

    const view = new View({
      projection: options.projection,
      extent: options.maxExtent,
      center: initialOptions?.initialCenter,
      zoom: initialOptions?.initialZoom,
      showFullExtent: true,
    });

    const isInIframe = window.self !== window.top;
    const olMap = new OlMap({
      controls: [],
      interactions: defaultInteractions({
        altShiftDragRotate: false,
        pinchRotate: false,
        mouseWheelZoom: !isInIframe,
        dragPan: !isInIframe,
      }).extend(isInIframe ? [
        new DragPan({
          condition: function (event) {
            return event.activePointers?.length === 2 || mouseOnly(event);
          },
        }),
        new MouseWheelZoom({ condition: platformModifierKeyOnly }),
      ] : []),
      view,
    });
    // always add the attribution control
    olMap.addControl(new Attribution({
      collapsed: false,
    }));

    this.initialExtent = options.initialExtent?.length === 4
      ? options.initialExtent
      : options.maxExtent;

    if (this.toolManager.value) {
      this.toolManager.value.destroy();
    }

    if (this.layerManager.value) {
      this.layerManager.value.destroy();
    }

    if (this.map.value) {
      this.map.value.dispose();
    }

    const layerManager = new OpenLayersLayerManager(olMap, this.ngZone, this.httpXsrfTokenExtractor);
    layerManager.init();
    const toolManager = new OpenLayersToolManager(olMap, this.ngZone, this.in3D);
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

  private getFeaturesExtent(olFeatures: Feature<Geometry>[]) {
    if (olFeatures.length === 0) {
      return;
    }
    const extents = olFeatures
      .map(f => f.getGeometry()?.getExtent())
      .filter((e): e is Extent => typeof e !== "undefined");
    if (extents.length === 0) {
      return;
    }
    const totalExtent = extents[0];
    extents.slice(1).forEach(e => extend(totalExtent, e));
    return totalExtent;
  }

  public setCenterAndZoom(center: number[], zoom: number) {
      this.initialCenterZoom = [ center, zoom ];

      this.executeMapAction(olMap => {
          const view = olMap.getView();
          view.setCenter(center);
          view.setZoom(zoom);
      });
  }

  public centerFeatures(olFeatures: Feature<Geometry>[]) {
    const totalExtent = this.getFeaturesExtent(olFeatures);
    if (!totalExtent) {
      return;
    }
    this.executeMapAction(olMap => {
      olMap.getView().setCenter(getCenter(totalExtent));
    });
  }

  public zoomToFeatures(olFeatures: Feature<Geometry>[]) {
    const totalExtent = this.getFeaturesExtent(olFeatures);
    if (!totalExtent) {
      return;
    }
    this.zoomToExtent(totalExtent);
  }

  public zoomToGeometry(geom?: Geometry) {
    if (!geom) {
      return;
    }
    this.zoomToExtent(geom.getExtent());
  }

  private zoomToExtent(extent: Extent) {
    this.executeMapAction(olMap => {
      olMap.getView().fit(buffer(extent, 10), { duration: 1000, padding: this.mapPadding });
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

  public setPadding(padding: number[]) {
    this.mapPadding = padding;
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
          const { scale, resolution } = OpenLayersHelper.getResolutionAndScale(view);
          return {
            zoomLevel: view.getZoom() || 0,
            minZoomLevel: view.getMinZoom() || 0,
            maxZoomLevel: view.getMaxZoom() || 0,
            resolution,
            minResolution: view.getMinResolution() || 0,
            maxResolution: view.getMaxResolution() || 0,
            scale,
            size: olMap.getSize(),
            center: olMap.getView().getCenter() != null ? olMap.getView().getCenter() : undefined,
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
          OpenLayersMapImageExporter.exportMapImage$(olMap.getSize() as Size, olMap.getView(), options, extraLayers, this.ngZone, this.httpXsrfTokenExtractor),
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
  ): Observable<FeatureModel[] | ErrorResponseModel> {
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

  public getCesiumLayerManager$(): Observable<CesiumLayerManager> {
    const isLayerManager = (item: CesiumLayerManager | null): item is CesiumLayerManager => item !== null;
    return this.map3D.asObservable().pipe(filter(isLayerManager));
  }

  public executeCLMAction(fn: (cesiumLayerManager: CesiumLayerManager) => void) {
    this.getCesiumLayerManager$()
      .pipe(take(1))
      .subscribe(cesiumLayerManager => fn(cesiumLayerManager));
  }

  public make3D(){
    if (!this.made3D) {
      this.executeMapAction(olMap => {
        this.map3D.next(new CesiumLayerManager(olMap, this.ngZone, this.map.getValue()?.getView().getProjection()));
      });
      this.executeCLMAction(cesiumLayerManager => {
        cesiumLayerManager.init();
      });
      this.made3D = true;
    }
  }

  public switch3D(){
    this.executeCLMAction(cesiumLayerManager => {
      cesiumLayerManager.switch3D();
    });
    this.in3D.next(!this.in3D.value);
    if (this.map.value?.getView().getProjection() !== getProjection('EPSG:3857')) {
      this.getLayerManager$().pipe(take(1)).subscribe(layerManager => {
        if (this.in3D.value) {
          layerManager.addSubstituteWebMercatorLayers();
        } else {
          layerManager.removeSubstituteWebMercatorLayers();
        }
      });
    }
  }

  public get3DLayerIdByIndex(index: number): string {
    return this.map3D.value?.getLayerId(index) || '';
  }
}
