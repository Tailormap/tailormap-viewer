import { merge, Subject } from 'rxjs';
import { DrawingToolConfigModel, DrawingType } from '../../models/tools/drawing-tool-config.model';
import OlMap from 'ol/Map';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import GeometryType from 'ol/geom/GeometryType';
import { MapStyleHelper } from '../../helpers/map-style.helper';
import { DrawingEnableToolArguments, DrawingToolEvent, DrawingToolModel } from '../../models/tools/drawing-tool.model';
import { NgZone } from '@angular/core';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import Geometry from 'ol/geom/Geometry';
import BaseEvent from 'ol/events/Event';
import { getCenter } from 'ol/extent';
import { FeatureHelper } from '../../helpers/feature.helper';
import { GeometryTypeHelper } from '../../helpers/geometry-type.helper';
import { MapSizeHelper } from '../../helpers/map-size.helper';

export class OpenLayersDrawingTool implements DrawingToolModel {

  private destroyed = new Subject();
  private drawInteraction: Draw | null = null;
  private listeners: EventsKey[] = [];

  private drawStartSubject: Subject<DrawingToolEvent> = new Subject<DrawingToolEvent>();
  public drawStart$ = this.drawStartSubject.asObservable();

  private drawChangeSubject: Subject<DrawingToolEvent> = new Subject<DrawingToolEvent>();
  public drawChange$ = this.drawChangeSubject.asObservable();

  private drawEndSubject: Subject<DrawingToolEvent> = new Subject<DrawingToolEvent>();
  public drawEnd$ = this.drawEndSubject.asObservable();

  public drawing$ = merge(this.drawStart$, this.drawChange$, this.drawEnd$);

  private static getDrawingType(type?: DrawingType) {
    if (type === 'line') {
      return GeometryType.LINE_STRING;
    }
    if (type === 'area') {
      return GeometryType.POLYGON;
    }
    if (type === 'circle') {
      return GeometryType.CIRCLE;
    }
    return GeometryType.POINT;
  }

  constructor(
    public id: string,
    private toolConfig: DrawingToolConfigModel,
    private olMap: OlMap,
    private ngZone: NgZone,
  ) {}

  public isActive = false;

  public destroy(): void {
    this.disable();
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public disable(): void {
    this.isActive = false;
    this.stopDrawing();
  }

  public enable(args: DrawingEnableToolArguments): void {
    this.listeners = [];
    this.isActive = true;
    this.drawInteraction = new Draw({
      type: OpenLayersDrawingTool.getDrawingType(args.type || this.toolConfig.drawingType || 'point'),
      style: this.getMeasureDrawingStyle(),
    });
    this.olMap.addInteraction(this.drawInteraction);
    this.listeners.push(this.drawInteraction.on('drawstart', (e: DrawEvent) => this.drawStarted(e)));
    this.listeners.push(this.drawInteraction.on('drawend', (e: DrawEvent) => {
      this.ngZone.run(() => this.drawEndSubject.next(this.getEvent(e.feature.getGeometry(), 'end')));
    }));
  }

  private stopDrawing() {
    if (!this.drawInteraction) {
      return;
    }
    this.olMap.removeInteraction(this.drawInteraction);
    this.drawInteraction.dispose();
    this.drawInteraction = null;
    unByKey(this.listeners);
    this.listeners = [];
  }

  private getMeasureDrawingStyle() {
    return MapStyleHelper.getStyle({
      styleKey: 'drawing-style',
      zIndex: 9999,
      strokeColor: 'rgba(0, 0, 0, 0.3)',
      strokeWidth: 2,
      pointType: 'circle',
      pointStrokeColor: 'rgba(0, 0, 0, 0.7)',
      pointFillColor: 'rgba(255, 255, 255, 0.5)',
      ...(this.toolConfig.style || {}),
    });
  }

  private drawStarted(e: DrawEvent) {
    this.ngZone.run(() => this.drawStartSubject.next(this.getEvent(e.feature.getGeometry(), 'start')));
    const featureGeom = e.feature.getGeometry();
    if (featureGeom !== undefined) {
      this.listeners.push(featureGeom.on('change', (changeEvt: BaseEvent) => {
        this.ngZone.run(() => this.drawChangeSubject.next(this.getEvent(changeEvt.target as Geometry, 'change')));
      }));
    }
  }

  private getEvent(geometry: Geometry | undefined, type: 'start' | 'change' | 'end'): DrawingToolEvent {
    if (undefined === geometry){
      return {centerCoordinate: [], lastCoordinate: [], type, geometry:''};
    }
    const coordinates = GeometryTypeHelper.isKnownGeometry(geometry)
      ? geometry.getFlatCoordinates()
      : [];
    const lastCoordinate = coordinates.length > 1
      ? (
        GeometryTypeHelper.isPolygonGeometry(geometry)
          ? coordinates.slice(-4, -2) // for Polygons get the coordinate before the last since its circular so last = first
          : coordinates.slice(-2)
      )
      : [];
    return {
      geometry: FeatureHelper.getWKT(geometry, this.olMap),
      lastCoordinate,
      centerCoordinate: getCenter(geometry.getExtent()),
      radius: GeometryTypeHelper.isCircleGeometry(geometry) ? geometry.getRadius() : undefined,
      size: this.toolConfig.computeSize ? MapSizeHelper.getSize(geometry) : 0,
      type,
    };
  }

}
