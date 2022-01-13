/* eslint-disable rxjs/finnish */
import { default as OlMap } from 'ol/Map';
import Projection from 'ol/proj/Projection';
import View  from 'ol/View';
import { NgZone } from '@angular/core';
import { defaults as defaultInteractions } from 'ol/interaction';
import { LayerManagerModel, MapViewerModel, MapViewerOptionsModel } from '../models';
import { ProjectionsHelper } from '../helpers/projections.helper';
import { OpenlayersExtent } from '../models/extent.type';
import { OpenLayersLayerManager } from './open-layers-layer-manager';
import { BehaviorSubject, concatMap, filter, map, Observable, take } from 'rxjs';
import { Size } from 'ol/size';

export class OpenLayersMap implements MapViewerModel {

  private map: BehaviorSubject<OlMap | null> = new BehaviorSubject<OlMap | null>(null);
  private layerManager: BehaviorSubject<LayerManagerModel | null> = new BehaviorSubject<LayerManagerModel | null>(null);

  private previousMap: OlMap | null = null;
  private previousLayerManager: OpenLayersLayerManager | null = null;

  private readonly resizeObserver: ResizeObserver;
  private initialExtent: OpenlayersExtent = [];

  constructor(
    private ngZone: NgZone,
  ) {
    this.resizeObserver = new ResizeObserver(() => this.updateMapSize());
  }

  public initMap(options: MapViewerOptionsModel) {
    if (this.previousMap && this.previousMap.getView().getProjection().getCode() === options.projection) {
      // Do not re-create the map if the projection is the same as previous
      this.previousMap.getView().getProjection().setExtent(options.maxExtent);
      if (options.initialExtent && options.initialExtent.length > 0) {
        this.previousMap.getView().fit(options.initialExtent);
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

    if (this.previousLayerManager) {
      this.previousLayerManager.destroy();
    }

    if (this.previousMap) {
      this.previousMap.dispose();
    }

    const layerManager = new OpenLayersLayerManager(olMap);
    layerManager.init();
    this.previousLayerManager = layerManager;
    this.previousMap = olMap;

    this.map.next(olMap);
    this.layerManager.next(layerManager);
  }

  public render(container: HTMLElement) {
    this.ngZone.runOutsideAngular(this._render.bind(this, container));
  }

  public getLayerManager$(): Observable<LayerManagerModel> {
    const isLayerManager = (item: LayerManagerModel | null): item is LayerManagerModel => item !== null;
    return this.layerManager.asObservable().pipe(filter(isLayerManager));
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
