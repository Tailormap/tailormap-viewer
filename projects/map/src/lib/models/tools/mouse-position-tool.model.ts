import { ToolModel } from './tool.model';
import { Observable } from 'rxjs';

export interface MouseMoveEvent {
  type: 'move' | 'out';
  mapCoordinates: [ number, number ];
  mouseCoordinates: [ number, number ];
}

export interface MousePositionToolModel extends ToolModel {
  mouseMove$: Observable<MouseMoveEvent>;
}
