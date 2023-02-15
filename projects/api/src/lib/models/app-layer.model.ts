import { TileLayerHiDpiMode } from './layer-hi-dpi-mode.enum';

export interface AppLayerModel {
  id: number;
  layerName: string;
  title: string;
  serviceId: number;
  url?: string;
  visible: boolean;
  hasAttributes: boolean;
  minScale?: number;
  maxScale?: number;
  legendImageUrl?: string;
  tilingDisabled?: boolean;
  tilingGutter?: number;
  hiDpiDisabled?: boolean;
  hiDpiMode?: TileLayerHiDpiMode;
  hiDpiSubstituteLayer?: string;
  opacity: number;
}
