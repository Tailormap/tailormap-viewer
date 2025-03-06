import { ToolModel } from './tool.model';
import { Observable } from 'rxjs';
import { FeatureInfo3DModel } from '../selection3d.model';

export interface MapClickEvent {
  mapCoordinates: [ number, number ];
  mouseCoordinates: [ number, number ];
  resolution: number;
  scale: number;
  cesiumFeatureInfo?: FeatureInfo3DModel;
}

export interface MapClickToolModel extends ToolModel {
  mapClick$: Observable<MapClickEvent>;
}
