import { ToolConfigModel } from './tool-config.model';
import { ToolTypeEnum } from './tool-type.enum';

export type DrawingType = 'point' | 'line' | 'area' | 'circle';

export interface DrawingToolConfigModel extends ToolConfigModel {
  type: ToolTypeEnum.Draw;
  computeSize?: boolean;
  drawingType?: DrawingType;
  strokeColor?: string;
  pointStrokeColor?: string;
  pointFillColor?: string;
}
