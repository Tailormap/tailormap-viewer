import { MapClickToolConfigModel, MapClickToolModel, MapClickEvent } from '../../models';
import { Observable, Subject, takeUntil, combineLatest, startWith } from 'rxjs';
import { OpenLayersEventManager } from '../open-layers-event-manager';
import { withLatestFrom } from 'rxjs/operators';
import { CesiumEventManager } from '../cesium-map/cesium-event-manager';

export class OpenLayersMapClickTool implements MapClickToolModel {

  private enabled = new Subject();

  constructor(
    public id: string,
    private _toolConfig: MapClickToolConfigModel,
    private in3D$: Observable<boolean>,
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
    combineLatest([
      OpenLayersEventManager.onMapClick$(),
      CesiumEventManager.onMap3DClick$().pipe(startWith(null)),
    ])
      .pipe(
        takeUntil(this.enabled),
        withLatestFrom(this.in3D$, this.mapClick$.pipe(startWith({ mapCoordinates: [ 0, 0 ], mouseCoordinates: [ 0, 0 ] }))),
      )
      .subscribe(([[ click2D, click3D ], in3D, latestMapClick ]) => {
        if (click3D && in3D) {
          if (latestMapClick.mapCoordinates[0] !== click3D.position.x || latestMapClick.mapCoordinates[1] !== click3D.position.y) {
            this.mapClickSubject.next({
              mapCoordinates: [ click3D.position.x, click3D.position.y ],
              mouseCoordinates: [ click2D.pixel[0], click2D.pixel[1] ],
              cesiumFeatureInfo: click3D.featureInfo,
            });
          }
        } else {
          this.mapClickSubject.next({
            mapCoordinates: [ click2D.coordinate[0], click2D.coordinate[1] ],
            mouseCoordinates: [ click2D.pixel[0], click2D.pixel[1] ],
          });
        }
      });
    this.isActive = true;
  }

}
