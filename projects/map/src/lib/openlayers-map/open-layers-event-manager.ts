import { Map as OlMap } from 'ol';
import { NgZone } from '@angular/core';
import { Observable, Subject, takeUntil, filter, skipUntil } from 'rxjs';
import { default as MapEvent } from 'ol/MapEvent';
import { default as BaseEvent } from 'ol/events/Event';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { MapBrowserEvent } from 'ol';
import { ObjectEvent } from 'ol/Object';
import { default as RenderEvent } from 'ol/render/Event';

type OlEventType = 'change' | 'error' | 'click' | 'dblclick' | 'pointermove' | 'singleclick' | 'pointerdrag'
  | 'movestart' | 'moveend' | 'propertychange' | 'change:layergroup' | 'change:size' | 'change:target' | 'change:view'
  | 'postrender' | 'precompose' | 'postcompose' | 'rendercomplete';

interface EventManagerEvent<EventType extends BaseEvent = BaseEvent> {
  eventKey?: EventsKey;
  stream: Subject<EventType>;
}

export class OpenLayersEventManager {

  private mapMoveEndEvent: EventManagerEvent<MapEvent> = { stream: new Subject<MapEvent>() };
  private mapClickEvent: EventManagerEvent<MapBrowserEvent<PointerEvent>> = { stream: new Subject<MapBrowserEvent<PointerEvent>>() };
  private mouseMoveEvent: EventManagerEvent<MapBrowserEvent<PointerEvent>> = { stream: new Subject<MapBrowserEvent<PointerEvent>>() };
  private changeViewEvent: EventManagerEvent<ObjectEvent> = { stream: new Subject<ObjectEvent>() };
  private renderCompleteEvent: EventManagerEvent<RenderEvent> = { stream: new Subject<RenderEvent>() };
  private mapMoveStartEvent: EventManagerEvent<MapEvent> = { stream: new Subject<MapEvent>() };
  private pointerDragEvent: EventManagerEvent<MapBrowserEvent<PointerEvent>> = { stream: new Subject<MapBrowserEvent<PointerEvent>>() };
  private in3d = false;
  private destroyed = new Subject();

  public initEvents(
    olMap: OlMap,
    ngZone: NgZone,
    in3d$: Observable<boolean>,
  ) {
    this.destroyed = new Subject();
    this.registerEvent(olMap, ngZone, 'moveend', this.mapMoveEndEvent);
    this.registerEvent(olMap, ngZone, 'singleclick', this.mapClickEvent);
    this.registerEvent(olMap, ngZone, 'pointermove', this.mouseMoveEvent);
    this.registerEvent(olMap, ngZone, 'change:view', this.changeViewEvent);
    this.registerEvent(olMap, ngZone, 'rendercomplete', this.renderCompleteEvent);
    this.registerEvent(olMap, ngZone, 'movestart', this.mapMoveStartEvent);
    this.registerEvent(olMap, ngZone, 'pointerdrag', this.pointerDragEvent);
    in3d$
      .pipe(takeUntil(this.destroyed))
      .subscribe(in3d => this.in3d = in3d);
  }

  public destroy() {
    this.destroyed.next(true);
    this.destroyed.complete();
    this.deregisterEvent(this.mapMoveEndEvent);
    this.deregisterEvent(this.mapClickEvent);
    this.deregisterEvent(this.mouseMoveEvent);
    this.deregisterEvent(this.changeViewEvent);
    this.deregisterEvent(this.renderCompleteEvent);
    this.deregisterEvent(this.mapMoveStartEvent);
    this.deregisterEvent(this.pointerDragEvent);
  }

  private deregisterEvent<EventType extends BaseEvent>(event: EventManagerEvent<EventType>) {
    if (event.eventKey) {
      unByKey(event.eventKey);
    }
  }

  private registerEvent<EventType extends BaseEvent>(
    olMap: OlMap,
    ngZone: NgZone,
    evtKey: OlEventType,
    event: EventManagerEvent<EventType>,
  ) {
    this.deregisterEvent(event);
    event.eventKey = olMap.on(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - for some weird reason TS won't recognize the type of evtKey and sees it as string
      evtKey,
      (e: EventType) => ngZone.run(() => event.stream.next(e)),
    );
  }

  public onMapMove$(): Observable<MapEvent> {
    return this.mapMoveEndEvent.stream.asObservable();
  }

  public onMapClick$(): Observable<MapBrowserEvent<PointerEvent>> {
    return this.mapClickEvent.stream.asObservable()
      .pipe(filter(() => !this.in3d));
  }

  public onMouseMove$(): Observable<MapBrowserEvent<PointerEvent>> {
    return this.mouseMoveEvent.stream.asObservable();
  }

  public onChangeView$(): Observable<ObjectEvent> {
    return this.changeViewEvent.stream.asObservable();
  }

  public onMapMoveStart$(): Observable<MapEvent> {
    return this.mapMoveStartEvent.stream.asObservable()
      .pipe(
        skipUntil(this.renderCompleteEvent.stream.asObservable()),
      );
  }

  public onPointerDrag$(): Observable<MapBrowserEvent<PointerEvent>> {
    return this.pointerDragEvent.stream.asObservable();
  }
}
