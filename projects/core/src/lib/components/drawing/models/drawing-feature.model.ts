import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';

export type MarkerType = 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'star' | 'arrow';

export enum ArrowTypeEnum {
  NONE = 'none',
  START = 'start',
  END = 'end',
  BOTH = 'both',
  ALONG = 'along',
}

export enum StrokeTypeEnum {
  SOLID = 'solid',
  DASH = 'dash',
  DOT = 'dot',
}

export enum LabelStyleEnum {
  ITALIC = 'ITALIC',
  BOLD = 'BOLD',
}

export interface DrawingFeatureStyleModel {
  marker?: MarkerType;
  markerSize?: number;
  markerFillColor?: string;
  markerStrokeColor?: string;
  markerStrokeWidth?: number;
  markerRotation?: number;
  fillOpacity?: number;
  fillColor?: string;
  stripedFill?: boolean;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeType?: StrokeTypeEnum;
  arrowType?: ArrowTypeEnum;
  label?: string;
  labelSize?: number;
  labelColor?: string;
  labelStyle?: LabelStyleEnum[];
  labelRotation?: number;
  labelOutlineColor?: string;
}

export interface DrawingFeatureModelAttributes extends FeatureModelAttributes {
  type: DrawingFeatureTypeEnum;
  style: DrawingFeatureStyleModel;
  selected?: boolean;
  zIndex?: number;
}

export type DrawingFeatureModel = FeatureModel<DrawingFeatureModelAttributes>;
