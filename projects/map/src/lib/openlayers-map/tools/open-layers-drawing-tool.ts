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
import { Circle, LineString, Point, Polygon } from 'ol/geom';
import { getArea, getLength } from 'ol/sphere';
import Geometry from 'ol/geom/Geometry';
import BaseEvent from 'ol/events/Event';
import WKT from 'ol/format/WKT';

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
      type: OpenLayersDrawingTool.getDrawingType(args.type || this.toolConfig.drawingType),
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
      styleKey: 'measure-style',
      strokeColor: this.toolConfig.strokeColor || 'rgba(0, 0, 0, 0.3)',
      strokeWidth: 2,
      pointType: 'circle',
      pointStrokeColor: this.toolConfig.pointStrokeColor || 'rgba(0, 0, 0, 0.7)',
      pointFillColor: this.toolConfig.pointFillColor || 'rgba(255, 255, 255, 0.5)',
    });
  }

  private drawStarted(e: DrawEvent) {
    this.ngZone.run(() => this.drawStartSubject.next(this.getEvent(e.feature.getGeometry(), 'start')));
    this.listeners.push(e.feature.getGeometry().on('change', (changeEvt: BaseEvent) => {
      this.ngZone.run(() => this.drawChangeSubject.next(this.getEvent(changeEvt.target as Geometry, 'change')));
    }));
  }

  private getEvent(geometry: Geometry, type: 'start' | 'change' | 'end'): DrawingToolEvent {
    const coordinates = geometry instanceof LineString || geometry instanceof Polygon || geometry instanceof Point || geometry instanceof Circle
      ? geometry.getFlatCoordinates()
      : [];
    const lastCoordinate = coordinates.length > 1
      ? (
        geometry instanceof Polygon
          ? coordinates.slice(-4, -2) // for Polygons get the coordinate before the last since its circular so last = first
          : coordinates.slice(-2)
      )
      : [];
    return {
      geometry: (new WKT()).writeGeometry(geometry),
      lastCoordinate,
      size: this.getSize(geometry),
      type,
    };
  }

  private getSize(geometry?: Geometry) {
    if (this.toolConfig.computeSize && geometry instanceof LineString) {
      return getLength(geometry);
    }
    if (this.toolConfig.computeSize && geometry instanceof Polygon) {
      return getArea(geometry);
    }
    return 0;
  }

}
