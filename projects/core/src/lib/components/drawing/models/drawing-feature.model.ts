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

export interface LineStyleModel {
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeType?: StrokeTypeEnum | number[];
  dashOffset?: number;
  arrowType?: ArrowTypeEnum;
  strokeOffset?: number;
}

export interface CommonDrawingFeatureStyleModel {
  description?: string;
}

export interface LabelDrawingFeatureStyleModel extends CommonDrawingFeatureStyleModel {
  label?: string;
  labelSize?: number;
  labelColor?: string;
  labelStyle?: LabelStyleEnum[];
  labelRotation?: number;
  labelOutlineColor?: string;
}

export interface ImageDrawingFeatureStyleModel extends LabelDrawingFeatureStyleModel {
  markerImage?: string; // this is the relative url after the API base path to a marker image
  markerImageWidth?: number;
  markerImageHeight?: number;
  markerRotation?: number;
  markerSize?: number;
}

export interface MarkerDrawingFeatureStyleModel extends LabelDrawingFeatureStyleModel  {
  marker?: MarkerType;
  markerSize?: number;
  markerFillColor?: string;
  markerStrokeColor?: string;
  markerStrokeWidth?: number;
  markerRotation?: number;
}

export interface LineDrawingFeatureStyleModel extends LabelDrawingFeatureStyleModel, LineStyleModel  {
  secondaryStroke?: LineStyleModel;
  tertiaryStroke?: LineStyleModel;
  showTotalSize?: boolean;
  showSegmentSize?: boolean;
}

export interface PolygonDrawingFeatureStyleModel extends LineDrawingFeatureStyleModel {
  fillOpacity?: number;
  fillColor?: string;
  stripedFill?: boolean;
}

export type DrawingFeatureStyleModel =
  LabelDrawingFeatureStyleModel &
  ImageDrawingFeatureStyleModel &
  MarkerDrawingFeatureStyleModel &
  LineDrawingFeatureStyleModel &
  PolygonDrawingFeatureStyleModel;

export type DrawingStyleTypeMap = {
  [DrawingFeatureTypeEnum.IMAGE]: ImageDrawingFeatureStyleModel;
  [DrawingFeatureTypeEnum.POINT]: MarkerDrawingFeatureStyleModel;
  [DrawingFeatureTypeEnum.LINE]: LineDrawingFeatureStyleModel;
  [DrawingFeatureTypeEnum.LABEL]: LabelDrawingFeatureStyleModel;
  [DrawingFeatureTypeEnum.POLYGON]: PolygonDrawingFeatureStyleModel;
  [DrawingFeatureTypeEnum.SQUARE]: PolygonDrawingFeatureStyleModel;
  [DrawingFeatureTypeEnum.SQUARE_SPECIFIED_LENGTH]: PolygonDrawingFeatureStyleModel;
  [DrawingFeatureTypeEnum.RECTANGLE]: PolygonDrawingFeatureStyleModel;
  [DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE]: PolygonDrawingFeatureStyleModel;
  [DrawingFeatureTypeEnum.ELLIPSE]: PolygonDrawingFeatureStyleModel;
  [DrawingFeatureTypeEnum.CIRCLE]: PolygonDrawingFeatureStyleModel;
  [DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS]: PolygonDrawingFeatureStyleModel;
  [DrawingFeatureTypeEnum.STAR]: PolygonDrawingFeatureStyleModel;
};

export interface DrawingFeatureModelAttributes extends FeatureModelAttributes {
  type: DrawingFeatureTypeEnum;
  style: DrawingFeatureStyleModel;
  lockedStyle?: boolean;
  rectangleSize?: { width: number; height: number };
  circleRadius?: number;
  squareLength?: number;
  selected?: boolean;
  zIndex?: number;
}


export type DrawingFeatureModel = FeatureModel<DrawingFeatureModelAttributes>;
