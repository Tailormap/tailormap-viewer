export type MapStylePointType = 'label' | 'square' | 'triangle' | 'star' | 'cross' | 'circle' | 'arrow' | 'diamond' | 'view_orientation';

export interface MapStyleModel {
  styleKey?: string;
  zIndex?: number;
  pointType?: MapStylePointType;
  pointFillColor?: string;
  pointStrokeColor?: string;
  pointStrokeWidth?: number;
  pointSize?: number;
  pointRotation?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokeType?: 'solid' | 'dash' | 'dot';
  arrowType?: 'none' | 'start' | 'end' | 'both' | 'along';
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
  buffer?: string;
  showTotalSize?: boolean;
  showSegmentSize?: boolean;
  showVertices?: boolean;
}
