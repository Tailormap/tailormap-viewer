import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { DrawingFeatureTypeEnum } from './drawing-feature-type.enum';

export type MakerType = 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'star' | 'arrow';

export interface DrawingFeatureStyleModel {
  marker?: MakerType;
  markerSize?: number;
  markerFillColor?: string;
  markerStrokeColor?: string;
  markerStrokeWidth?: number;
  markerRotation?: number;
  fillOpacity?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  label?: string;
  labelSize?: number;
}

export interface DrawingFeatureModelAttributes extends FeatureModelAttributes {
  type: DrawingFeatureTypeEnum;
  style: DrawingFeatureStyleModel;
  selected?: boolean;
}

export type DrawingFeatureModel = FeatureModel<DrawingFeatureModelAttributes>;
