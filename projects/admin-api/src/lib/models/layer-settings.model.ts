import { TileLayerHiDpiModeEnum } from './tile-layer-hi-dpi-mode.enum';

export interface LayerSettingsModel {
  title?: string;
  hiDpiDisabled?: boolean;
  tilingDisabled?: boolean;
  tilingGutter?: number;
  hiDpiMode?: TileLayerHiDpiModeEnum;
  hiDpiSubstituteLayer?: string;
}
