import { default as OlMap } from 'ol/Map';
import { NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { default as MapEvent } from 'ol/MapEvent';
import { default as BaseEvent } from 'ol/events/Event';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { MapBrowserEvent } from 'ol';

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

  public static initEvents(olMap: OlMap, ngZone: NgZone) {
    OpenLayersEventManager.registerEvent(olMap, ngZone, 'moveend', OpenLayersEventManager.mapMoveEndEvent);
    OpenLayersEventManager.registerEvent(olMap, ngZone, 'click', OpenLayersEventManager.mapClickEvent);
  }

  private static registerEvent<EventType extends BaseEvent>(
    olMap: OlMap,
    ngZone: NgZone,
    evtKey: OlEventType,
    event: EventManagerEvent<EventType>,
  ) {
    if (event.eventKey) {
      unByKey(event.eventKey);
    }
    event.eventKey = olMap.on(
      // @ts-ignore - for some weird reason TS won't recognize the type of evtKey and sees it as string
      evtKey,
      (e: EventType) => ngZone.run(() => event.stream.next(e)),
    );
  }

  public static onMapMove$(): Observable<MapEvent> {
    return OpenLayersEventManager.mapMoveEndEvent.stream.asObservable();
  }

  public static onMapClick$(): Observable<MapBrowserEvent<MouseEvent>> {
    return OpenLayersEventManager.mapClickEvent.stream.asObservable();
  }

}
