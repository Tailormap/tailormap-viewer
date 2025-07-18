export type MapStylePointType = 'label' | 'square' | 'triangle' | 'star' | 'cross' | 'circle' | 'arrow' | 'diamond' | 'view_orientation';

export interface StrokeStyleModel {
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokeType?: 'solid' | 'dash' | 'dot' | number[];
  arrowType?: 'none' | 'start' | 'end' | 'both' | 'along';
  strokeOffset?: number;
  dashOffset?: number;
  patternSrc?: string;
}

export interface MapStyleModel extends StrokeStyleModel {
  styleKey?: string;
  zIndex?: number;
  pointImage?: string;
  pointImageWidth?: number;
  pointImageHeight?: number;
  pointType?: MapStylePointType;
  pointFillColor?: string;
  pointStrokeColor?: string;
  pointStrokeWidth?: number;
  pointSize?: number;
  pointRotation?: number;
  secondaryStroke?: StrokeStyleModel;
  tertiaryStroke?: StrokeStyleModel;
  fillColor?: string;
  fillOpacity?: number;
  stripedFill?: boolean;
  isSelected?: boolean;
  label?: string;
  labelSize?: number;
  labelColor?: string;
  labelStyle?: Array<'bold'|'italic'>;
  labelRotation?: number;
  labelOutlineColor?: string;
  buffer?: number;
  showTotalSize?: boolean;
  showSegmentSize?: boolean;
  showVertices?: boolean;
}
