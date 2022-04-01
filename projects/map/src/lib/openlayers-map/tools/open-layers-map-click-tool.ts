import { MapClickToolConfigModel, MapClickToolModel, MapClickEvent } from '../../models';
import { Observable, Subject, takeUntil } from 'rxjs';
import { OpenLayersEventManager } from '../open-layers-event-manager';

export class OpenLayersMapClickTool implements MapClickToolModel {

  private enabled = new Subject();

  constructor(
    public id: string,
    private toolConfig: MapClickToolConfigModel,
  ) {}

  private mapClickSubject: Subject<MapClickEvent> = new Subject<MapClickEvent>();
  public mapClick$: Observable<MapClickEvent> = this.mapClickSubject.asObservable();
  public isActive = false;

  public destroy(): void {
    this.disable();
  }

  public disable(): void {
    this.enabled.next(null);
    this.enabled.complete();
    this.isActive = false;
  }

  public enable(): void {
    this.enabled = new Subject();
    OpenLayersEventManager.onMapClick$()
      .pipe(takeUntil(this.enabled))
      .subscribe(evt => {
        this.mapClickSubject.next({
          mapCoordinates: [evt.coordinate[0], evt.coordinate[1]],
          mouseCoordinates: [evt.pixel[0], evt.pixel[1]],
        });
      });
    this.isActive = true;
  }

}
