import { ToolModel } from './tool.model';
import { Observable } from 'rxjs';

export interface MapClickEvent {
  mapCoordinates: [ number, number ];
  mouseCoordinates: [ number, number ];
  cesiumFeatureInfo?: {};
}

export interface MapClickToolModel extends ToolModel {
  mapClick$: Observable<MapClickEvent>;
}
