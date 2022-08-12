import { Observable, Subject, takeUntil } from 'rxjs';
import { OpenLayersEventManager } from '../open-layers-event-manager';
import { MouseMoveEvent, MousePositionToolModel, MousePositionToolConfigModel } from '../../models/tools';
import OlMap from 'ol/Map';
import { NgZone } from '@angular/core';

export class OpenLayersMousePositionTool implements MousePositionToolModel {

  private enabled = new Subject();
  private lastCoordinates: { mapCoordinates: [number, number]; mouseCoordinates: [number, number] } | null = null;

  constructor(
    public id: string,
    private _toolConfig: MousePositionToolConfigModel,
    private olMap: OlMap,
    private ngZone: NgZone,
  ) {}

  private mouseMoveSubject: Subject<MouseMoveEvent> = new Subject<MouseMoveEvent>();
  public mouseMove$: Observable<MouseMoveEvent> = this.mouseMoveSubject.asObservable();

  private pointerOutListener = () => {
    this.ngZone.run(() => {
      this.mouseMoveSubject.next({
        type: 'out',
        ...(this.lastCoordinates || { mapCoordinates: [ 0, 0 ], mouseCoordinates: [ 0, 0 ] }),
      });
    });
  };

  public isActive = false;

  public destroy(): void {
    this.disable();
  }

  public disable(): void {
    this.enabled.next(null);
    this.enabled.complete();
    this.olMap.getViewport().removeEventListener('pointerout', this.pointerOutListener);
    this.isActive = false;
  }

  public enable(): void {
    this.enabled = new Subject();
    OpenLayersEventManager.onMouseMove$()
      .pipe(takeUntil(this.enabled))
      .subscribe(evt => {
        this.lastCoordinates = { mapCoordinates: [ evt.coordinate[0], evt.coordinate[1] ], mouseCoordinates: [ evt.pixel[0], evt.pixel[1] ] };
        this.mouseMoveSubject.next({
          type: 'move',
          mapCoordinates: [ evt.coordinate[0], evt.coordinate[1] ],
          mouseCoordinates: [ evt.pixel[0], evt.pixel[1] ],
        });
      });
    this.olMap.getViewport().addEventListener('pointerout', this.pointerOutListener);
    this.isActive = true;
  }

}
