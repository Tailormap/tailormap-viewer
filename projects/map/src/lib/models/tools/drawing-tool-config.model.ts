import { ToolConfigModel } from './tool-config.model';
import { ToolTypeEnum } from './tool-type.enum';
import { MapStyleModel } from '../map-style.model';

export type DrawingType = 'point' | 'line' | 'area' | 'circle' | 'ellipse' | 'square' | 'rectangle' | 'star';

export interface DrawingToolConfigModel extends ToolConfigModel {
  type: ToolTypeEnum.Draw;
  drawingType?: DrawingType;
  style?: Partial<MapStyleModel>;
}
