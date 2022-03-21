export interface MapStyleModel {
  styleKey: string;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  pointType?: 'square' | 'triangle' | 'star' | 'cross';
  pointFillColor?: string;
  pointStrokeColor?: string;
}
