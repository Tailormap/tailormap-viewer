import { TileLayerHiDpiModeEnum } from '@tailormap-viewer/api';

export interface WMTSLayerSettingsModel {
  hiDpiMode: TileLayerHiDpiModeEnum;
  hiDpiSubstituteLayer: string;
}
