import { MapClickToolConfigModel, MapClickToolModel, MapClickEvent, Selection3dModel } from '../../models';
import { Observable, Subject, takeUntil, combineLatest, BehaviorSubject } from 'rxjs';
import { OpenLayersEventManager } from '../open-layers-event-manager';
import { CesiumEventManager } from '../cesium-map/cesium-event-manager';
import { CesiumLayerManager } from '../cesium-map/cesium-layer-manager';

export class OpenLayersMapClickTool implements MapClickToolModel {

  private enabled = new Subject();

  private click3D: BehaviorSubject<Selection3dModel | null> = new BehaviorSubject<Selection3dModel | null>(null);

  constructor(
    public id: string,
    private _toolConfig: MapClickToolConfigModel,
    private map3D$: Observable<CesiumLayerManager | null>,
    private in3D$: Observable<boolean>,
  ) {
    this.map3D$.subscribe(map3DValue => {
      console.log('new map3d value: ', map3DValue);
      if (map3DValue) {
        map3DValue.executeScene3DAction(scene3D => {
          console.log('scene: ', scene3D);
          CesiumEventManager.onMap3DClick$(scene3D).subscribe(click3DEvent => {
            this.click3D.next(click3DEvent);
          });
        });
      }
    });
  }

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
    console.log('now');
    combineLatest([
      OpenLayersEventManager.onMapClick$(),
      this.click3D.asObservable(),
      this.in3D$,
    ])
      .pipe(takeUntil(this.enabled))
      .subscribe(([ click2D, click3D, in3D ]) => {
        console.log('click 2D: ', click2D, ' click 3D: ', click3D, ' in3D: ', in3D);
        if (click3D && in3D) {
          console.log('3D: ', [ click3D.position.x, click3D.position.y ]);
          this.mapClickSubject.next({
            mapCoordinates: [ click3D.position.x, click3D.position.y ],
            mouseCoordinates: [ click2D.pixel[0], click2D.pixel[1] ],
          });
        } else {
          console.log('2D: ', [ click2D.coordinate[0], click2D.coordinate[1] ]);
          this.mapClickSubject.next({
            mapCoordinates: [ click2D.coordinate[0], click2D.coordinate[1] ],
            mouseCoordinates: [ click2D.pixel[0], click2D.pixel[1] ],
          });
        }
      });
    this.isActive = true;
  }

}
