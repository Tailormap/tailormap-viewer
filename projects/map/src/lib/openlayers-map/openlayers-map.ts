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
import { Size } from 'ol/size';

export class OpenLayersMap implements MapViewerModel {

  private projection: Projection | undefined;
  private resolutions: number[] | undefined;
  private initialExtent: OpenlayersExtent | undefined;
  private map: OlMap | undefined;
  private layerManager: OpenLayersLayerManager | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private mapPadding: [number, number, number, number] | undefined;

  constructor(
    private options: MapViewerOptionsModel,
    private ngZone: NgZone,
  ) {
    ngZone.runOutsideAngular(this.init.bind(this));
  }

  public init() {
    this.projection = new Projection({
      code: this.options.projection,
      extent: this.options.maxExtent,
    });
    this.resolutions = ProjectionsHelper.getResolutions(this.options.projection, this.options.maxExtent);
    this.initialExtent = this.options.initialExtent;
    this.map = new OlMap({
      controls: [],
      interactions: defaultInteractions({altShiftDragRotate: false, pinchRotate: false}),
      view: new View({
        projection: this.projection,
        resolutions: this.resolutions,
      }),
    });
    this.resizeObserver = new ResizeObserver(() => this.updateMapSize());
    return this.map;
  }

  public render(container: HTMLElement) {
    this.ngZone.runOutsideAngular(this._render.bind(this, container));
  }

  public getLayerManager(): LayerManagerModel {
    if (!this.layerManager) {
      this.layerManager = new OpenLayersLayerManager(this.getMap(), this.ngZone);
    }
    return this.layerManager;
  }

  public getVisibleExtent(): OpenlayersExtent {
    return this.getMap().getView().calculateExtent(this.getSizeIncludingPadding());
  }

  private getSizeIncludingPadding(extraPaddingPercentage: number = 1.1): Size {
    const mapSize = this.getMap().getSize();
    if (!mapSize) {
      return [0, 0];
    }
    const mapPadding = (this.mapPadding || [0, 0, 0, 0]).map(p => p * extraPaddingPercentage);
    return [
      mapSize[0] - mapPadding[1] - mapPadding[3],
      mapSize[1] - mapPadding[0] - mapPadding[2],
    ];
  }

  private _render(container: HTMLElement) {
    this.getMap().setTarget(container);
    this.getMap().render();
    if (this.initialExtent) {
      this.getMap().getView().fit(this.initialExtent);
    }
    window.setTimeout(() => this.updateMapSize(), 0);
    if (this.resizeObserver) {
      this.resizeObserver.observe(container);
    }
  }

  public setMapPadding(mapPadding: [number, number, number, number]) {
    this.mapPadding = mapPadding;
  }

  public setZoomLevel(zoom: number) {
    this.getMap().getView().setZoom(zoom);
  }

  public getZoomLevel(): number {
    return this.getMap().getView().getZoom() || 0;
  }

  public zoomIn() {
    this.getMap().getView().setZoom(this.getZoomLevel() + 1);
  }

  public zoomOut() {
    this.getMap().getView().setZoom(this.getZoomLevel() - 1);
  }

  private getMap() {
    if (!this.map) {
      return this.init();
    }
    return this.map;
  }

  private updateMapSize() {
    this.getMap().updateSize();
  }

}
