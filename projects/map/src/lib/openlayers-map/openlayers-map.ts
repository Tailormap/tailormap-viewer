/* eslint-disable rxjs/finnish */

import { default as OlMap } from 'ol/Map';
import Projection from 'ol/proj/Projection';
import View  from 'ol/View';
import { NgZone } from '@angular/core';
import { defaults as defaultInteractions } from 'ol/interaction';
import { MapViewerModel } from '../models/map-viewer.model';
import { MapViewerOptionsModel } from '../models/map-viewer-options.model';
import { ProjectionsHelper } from '../helpers/projections.helper';
import { OpenlayersExtent } from '../models/extent.type';
import { OpenLayersLayerManager } from './open-layers-layer-manager';
import { LayerManagerModel } from '../models/layer-manager.model';
import { concatMap, filter, map, Observable, Subject, take } from 'rxjs';
import { Size } from 'ol/size';

export class OpenLayersMap implements MapViewerModel {

  private map: Subject<OlMap> = new Subject<OlMap>();
  private layerManager: Subject<OpenLayersLayerManager> = new Subject<OpenLayersLayerManager>();

  private previousMap: OlMap | null = null;
  private previousLayerManager: OpenLayersLayerManager | null = null;

  private readonly resizeObserver: ResizeObserver;

  constructor(
    private ngZone: NgZone,
  ) {
    this.resizeObserver = new ResizeObserver(() => this.updateMapSize());
  }

  public setProjection(options: MapViewerOptionsModel) {
    if (this.previousMap && this.previousMap.getView().getProjection().getCode() === options.projection) {
      // Do not re-create the map if the projection is the same as previous
      this.previousMap.getView().getProjection().setExtent(options.maxExtent);
      return;
    }

    ProjectionsHelper.initProjection(options.projection, options.projectionDefinition);
    const projection = new Projection({
      code: options.projection,
      extent: options.maxExtent,
    });
    const resolutions = ProjectionsHelper.getResolutions(options.projection, options.maxExtent);

    const olMap = new OlMap({
      controls: [],
      interactions: defaultInteractions({altShiftDragRotate: false, pinchRotate: false}),
      view: new View({
        projection,
        resolutions,
      }),
    });

    if (this.previousLayerManager) {
      this.previousLayerManager.destroy();
    }

    if (this.previousMap) {
      this.previousMap.dispose();
    }

    const layerManager = new OpenLayersLayerManager(olMap);
    this.previousLayerManager = layerManager;
    this.previousMap = olMap;

    this.map.next(olMap);
    this.layerManager.next(layerManager);
  }

  public render(container: HTMLElement) {
    this.ngZone.runOutsideAngular(this._render.bind(this, container));
  }

  public getLayerManager$(): Observable<LayerManagerModel> {
    return this.layerManager.asObservable();
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

  private getMap$() {
    return this.map.asObservable();
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
      window.setTimeout(() => this.updateMapSize(), 0);
      if (this.resizeObserver) {
        this.resizeObserver.observe(container);
      }
    });
  }

  private updateMapSize() {
    this.executeMapAction(olMap => olMap.updateSize());
  }

  private executeMapAction(fn: (olMap: OlMap) => void) {
    this.getMap$()
      .pipe(
        filter(olMap => !!olMap),
        take(1),
      )
      .subscribe(olMap => fn(olMap));
  }

}
