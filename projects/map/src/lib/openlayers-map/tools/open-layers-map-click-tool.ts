import { OpenLayersTool } from './open-layers-tool';
import { MapClickToolModel } from '../../models';
import { Subject, takeUntil } from 'rxjs';
import { OpenLayersEventManager } from '../open-layers-event-manager';

export class OpenLayersMapClickTool implements OpenLayersTool {

  private enabled = new Subject();

  constructor(private toolConfig: MapClickToolModel) {}

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
    OpenLayersEventManager.onMapClick$()
      .pipe(takeUntil(this.enabled))
      .subscribe(evt => {
        this.toolConfig.onClick({
          mapCoordinates: [evt.coordinate[0], evt.coordinate[1]],
          mouseCoordinates: [evt.pixel[0], evt.pixel[1]],
        });
      });
    this.isActive = true;
  }

}
