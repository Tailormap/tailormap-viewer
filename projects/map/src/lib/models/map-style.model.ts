export type MapStylePointType = 'label' | 'square' | 'triangle' | 'star' | 'cross' | 'circle' | 'arrow' | 'diamond';

export interface MapStyleModel {
  styleKey: string;
  pointType?: MapStylePointType;
  pointFillColor?: string;
  pointStrokeColor?: string;
  pointStrokeWidth?: number;
  pointSize?: number;
  pointRotation?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  fillColor?: string;
  fillOpacity?: number;
  isSelected?: boolean;
  label?: string;
  labelSize?: number;
}
