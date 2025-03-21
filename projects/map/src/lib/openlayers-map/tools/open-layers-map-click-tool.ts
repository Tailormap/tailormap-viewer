import { MapClickToolConfigModel, MapClickToolModel, MapClickEvent } from '../../models';
import { Observable, Subject, takeUntil, switchMap } from 'rxjs';
import { OpenLayersEventManager } from '../open-layers-event-manager';
import { OpenLayersHelper } from '../helpers/open-layers.helper';
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
    this.in3D$.pipe(
      takeUntil(this.enabled),
      switchMap(in3D => in3D ? CesiumEventManager.onMap3DClick$() : OpenLayersEventManager.onMapClick$()),
    ).subscribe(click => {
      if (click && 'position' in click) {
        this.mapClickSubject.next({
          mapCoordinates: [ click.position.x, click.position.y ],
          mouseCoordinates: [ click.mouseCoordinates.x, click.mouseCoordinates.y ],
          cesiumFeatureInfo: click.featureInfo,
        });
      } else {
        const { scale, resolution } = OpenLayersHelper.getResolutionAndScale(click.map.getView());
        this.mapClickSubject.next({
          mapCoordinates: [ click.coordinate[0], click.coordinate[1] ],
          mouseCoordinates: [ click.pixel[0], click.pixel[1] ],
          resolution,
          scale,
        });
      }
    });
    this.isActive = true;
  }

}
