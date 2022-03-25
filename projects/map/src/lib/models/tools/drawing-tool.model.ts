import { ToolModel } from './tool.model';
import { DrawingType } from './drawing-tool-config.model';
import { Observable } from 'rxjs';
import Geometry from 'ol/geom/Geometry';

export interface DrawingToolEvent {
  geometry: Geometry;
  lastCoordinates: number[];
  size?: number;
}

export interface DrawingEnableToolArguments extends Record<string, unknown> {
  type: DrawingType;
}

export interface DrawingToolModel extends ToolModel {
  enable(enableArgs: DrawingEnableToolArguments): void;
  drawStart$: Observable<DrawingToolEvent>;
  drawChange$: Observable<DrawingToolEvent>;
  drawEnd$: Observable<DrawingToolEvent>;
}
