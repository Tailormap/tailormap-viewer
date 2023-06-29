import { TileLayerHiDpiMode } from './layer-hi-dpi-mode.enum';

export interface AppLayerModel {
  id: string;
  layerName: string;
  title: string;
  serviceId: string;
  url?: string;
  visible: boolean;
  hasAttributes: boolean;
  editable: boolean;
  minScale?: number;
  maxScale?: number;
  legendImageUrl?: string;
  tilingDisabled?: boolean;
  tilingGutter?: number;
  hiDpiDisabled?: boolean;
  hiDpiMode?: TileLayerHiDpiMode;
  hiDpiSubstituteLayer?: string;
  opacity: number;
  attribution?: string;
  description?: string;
}
