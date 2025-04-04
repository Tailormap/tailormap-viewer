import { Map as OlMap } from 'ol';
import { NgZone } from '@angular/core';
import { Observable, Subject, takeUntil, filter } from 'rxjs';
import { default as MapEvent } from 'ol/MapEvent';
import { default as BaseEvent } from 'ol/events/Event';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { MapBrowserEvent } from 'ol';
import { ObjectEvent } from 'ol/Object';

type OlEventType = 'change' | 'error' | 'click' | 'dblclick' | 'pointermove' | 'singleclick' | 'pointerdrag'
  | 'movestart' | 'moveend' | 'propertychange' | 'change:layergroup' | 'change:size' | 'change:target' | 'change:view'
  | 'postrender' | 'precompose' | 'postcompose' | 'rendercomplete';

interface EventManagerEvent<EventType extends BaseEvent = BaseEvent> {
  eventKey?: EventsKey;
  stream: Subject<EventType>;
}

export class OpenLayersEventManager {

  private static mapMoveEndEvent: EventManagerEvent<MapEvent> = { stream: new Subject<MapEvent>() };
  private static mapClickEvent: EventManagerEvent<MapBrowserEvent<PointerEvent>> = { stream: new Subject<MapBrowserEvent<PointerEvent>>() };
  private static mouseMoveEvent: EventManagerEvent<MapBrowserEvent<PointerEvent>> = { stream: new Subject<MapBrowserEvent<PointerEvent>>() };
  private static changeViewEvent: EventManagerEvent<ObjectEvent> = { stream: new Subject<ObjectEvent>() };
  private static in3d = false;
  private static destroyed = new Subject();

  public static initEvents(
    olMap: OlMap,
    ngZone: NgZone,
    in3d$: Observable<boolean>,
  ) {
    OpenLayersEventManager.destroyed = new Subject();
    OpenLayersEventManager.registerEvent(olMap, ngZone, 'moveend', OpenLayersEventManager.mapMoveEndEvent);
    OpenLayersEventManager.registerEvent(olMap, ngZone, 'singleclick', OpenLayersEventManager.mapClickEvent);
    OpenLayersEventManager.registerEvent(olMap, ngZone, 'pointermove', OpenLayersEventManager.mouseMoveEvent);
    OpenLayersEventManager.registerEvent(olMap, ngZone, 'change:view', OpenLayersEventManager.changeViewEvent);
    in3d$
      .pipe(takeUntil(OpenLayersEventManager.destroyed))
      .subscribe(in3d => OpenLayersEventManager.in3d = in3d);
  }

  public static destroy() {
    OpenLayersEventManager.destroyed.next(true);
    OpenLayersEventManager.destroyed.complete();
    OpenLayersEventManager.deregisterEvent(OpenLayersEventManager.mapMoveEndEvent);
    OpenLayersEventManager.deregisterEvent(OpenLayersEventManager.mapClickEvent);
    OpenLayersEventManager.deregisterEvent(OpenLayersEventManager.mouseMoveEvent);
    OpenLayersEventManager.deregisterEvent(OpenLayersEventManager.changeViewEvent);
  }

  private static deregisterEvent<EventType extends BaseEvent>(event: EventManagerEvent<EventType>) {
    if (event.eventKey) {
      unByKey(event.eventKey);
    }
  }

  private static registerEvent<EventType extends BaseEvent>(
    olMap: OlMap,
    ngZone: NgZone,
    evtKey: OlEventType,
    event: EventManagerEvent<EventType>,
  ) {
    OpenLayersEventManager.deregisterEvent(event);
    event.eventKey = olMap.on(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - for some weird reason TS won't recognize the type of evtKey and sees it as string
      evtKey,
      (e: EventType) => ngZone.run(() => event.stream.next(e)),
    );
  }

  public static onMapMove$(): Observable<MapEvent> {
    return OpenLayersEventManager.mapMoveEndEvent.stream.asObservable();
  }

  public static onMapClick$(): Observable<MapBrowserEvent<PointerEvent>> {
    return OpenLayersEventManager.mapClickEvent.stream.asObservable()
      .pipe(filter(() => !OpenLayersEventManager.in3d));
  }

  public static onMouseMove$(): Observable<MapBrowserEvent<PointerEvent>> {
    return OpenLayersEventManager.mouseMoveEvent.stream.asObservable();
  }

  public static onChangeView$(): Observable<ObjectEvent> {
    return OpenLayersEventManager.changeViewEvent.stream.asObservable();
  }

}
