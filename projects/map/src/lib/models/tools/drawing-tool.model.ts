import { ToolModel } from './tool.model';
import { DrawingType } from './drawing-tool-config.model';
import { Observable } from 'rxjs';
import { MapStyleModel } from '../map-style.model';

export interface DrawingToolEvent {
  geometry: string;
  centerCoordinate: number[];
  radius?: number;
  lastCoordinate: number[];
  type: 'start' | 'change' | 'end';
}

export interface DrawingEnableToolArguments extends Record<string, unknown> {
  type: DrawingType;
  style?: Partial<MapStyleModel>;
}

export interface DrawingToolModel extends ToolModel {
  enable(enableArgs: DrawingEnableToolArguments): void;
  drawStart$: Observable<DrawingToolEvent>;
  drawChange$: Observable<DrawingToolEvent>;
  drawEnd$: Observable<DrawingToolEvent>;
  drawing$: Observable<DrawingToolEvent | null>;
}
