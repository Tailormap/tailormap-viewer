import { ToolConfigModel } from './tool-config.model';
import { ToolTypeEnum } from './tool-type.enum';
import { MapStyleModel } from '../map-style.model';

export type DrawingType = 'point' | 'line' | 'area' | 'circle';

export interface DrawingToolConfigModel extends ToolConfigModel {
  type: ToolTypeEnum.Draw;
  computeSize?: boolean;
  drawingType?: DrawingType;
  style?: Partial<MapStyleModel>;
}
