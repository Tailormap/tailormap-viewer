import { ToolModel } from './tool.model';
import { Observable } from 'rxjs';

export interface MapClickEvent {
  mapCoordinates: [ number, number ];
  mouseCoordinates: [ number, number ];
  resolution?: number;
  scale?: number;
}

export interface MapClickToolModel extends ToolModel {
  mapClick$: Observable<MapClickEvent>;
}
