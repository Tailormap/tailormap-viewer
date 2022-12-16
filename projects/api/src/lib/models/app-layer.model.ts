import { CoordinateReferenceSystemModel } from './coordinate-reference-system.model';
import { LayerHiDpiMode } from './layer-hi-dpi-mode.enum';

export interface AppLayerModel {
  id: number;
  layerName: string;
  title: string;
  serviceId: number;
  url?: string;
  visible: boolean;
  hasAttributes: boolean;
  crs?: CoordinateReferenceSystemModel;
  minScale?: number;
  maxScale?: number;
  legendImageUrl?: string;
  hiDpiMode?: LayerHiDpiMode;
  hiDpiSubstituteLayer?: string;
  opacity?: number;
}
