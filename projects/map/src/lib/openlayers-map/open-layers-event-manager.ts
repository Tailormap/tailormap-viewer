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
  private static mapClickEvent: EventManagerEvent<MapBrowserEvent<MouseEvent>> = { stream: new Subject<MapBrowserEvent<MouseEvent>>() };
  private static mouseMoveEvent: EventManagerEvent<MapBrowserEvent<MouseEvent>> = { stream: new Subject<MapBrowserEvent<MouseEvent>>() };
  private static changeViewEvent: EventManagerEvent<ObjectEvent> = { stream: new Subject<ObjectEvent>() };
  private static in3D = false;
  private static destroyed = new Subject();

  public static initEvents(
    olMap: OlMap,
    ngZone: NgZone,
    in3D$: Observable<boolean>,
  ) {
    OpenLayersEventManager.destroyed = new Subject();
    OpenLayersEventManager.registerEvent(olMap, ngZone, 'moveend', OpenLayersEventManager.mapMoveEndEvent);
    OpenLayersEventManager.registerEvent(olMap, ngZone, 'singleclick', OpenLayersEventManager.mapClickEvent);
    OpenLayersEventManager.registerEvent(olMap, ngZone, 'pointermove', OpenLayersEventManager.mouseMoveEvent);
    OpenLayersEventManager.registerEvent(olMap, ngZone, 'change:view', OpenLayersEventManager.changeViewEvent);
    in3D$
      .pipe(takeUntil(OpenLayersEventManager.destroyed))
      .subscribe(in3D => OpenLayersEventManager.in3D = in3D);
  }

  public static destroy() {
    OpenLayersEventManager.destroyed.next(true);
    OpenLayersEventManager.destroyed.complete();
    OpenLayersEventManager.deRegisterEvent(OpenLayersEventManager.mapMoveEndEvent);
    OpenLayersEventManager.deRegisterEvent(OpenLayersEventManager.mapClickEvent);
    OpenLayersEventManager.deRegisterEvent(OpenLayersEventManager.mouseMoveEvent);
    OpenLayersEventManager.deRegisterEvent(OpenLayersEventManager.changeViewEvent);
  }

  private static deRegisterEvent<EventType extends BaseEvent>(event: EventManagerEvent<EventType>) {
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
    OpenLayersEventManager.deRegisterEvent(event);
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

  public static onMapClick$(): Observable<MapBrowserEvent<MouseEvent>> {
    return OpenLayersEventManager.mapClickEvent.stream.asObservable()
      .pipe(filter(() => !OpenLayersEventManager.in3D));
  }

  public static onMouseMove$(): Observable<MapBrowserEvent<MouseEvent>> {
    return OpenLayersEventManager.mouseMoveEvent.stream.asObservable();
  }

  public static onChangeView$(): Observable<ObjectEvent> {
    return OpenLayersEventManager.changeViewEvent.stream.asObservable();
  }

}
