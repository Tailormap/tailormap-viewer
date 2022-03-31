import { ToolModel } from './tool.model';
import { DrawingType } from './drawing-tool-config.model';
import { Observable } from 'rxjs';

export interface DrawingToolEvent {
  geometry: string;
  lastCoordinate: number[];
  size?: number;
  type: 'start' | 'change' | 'end';
}

export interface DrawingEnableToolArguments extends Record<string, unknown> {
  type: DrawingType;
}

export interface DrawingToolModel extends ToolModel {
  enable(enableArgs: DrawingEnableToolArguments): void;
  drawStart$: Observable<DrawingToolEvent>;
  drawChange$: Observable<DrawingToolEvent>;
  drawEnd$: Observable<DrawingToolEvent>;
  drawing$: Observable<DrawingToolEvent | null>;
}
