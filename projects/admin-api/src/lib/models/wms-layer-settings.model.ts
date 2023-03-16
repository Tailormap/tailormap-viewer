import { LayerSettingsModel } from './layer-settings.model';

export interface WMSLayerSettingsModel extends LayerSettingsModel {
  tilingDisabled: boolean;
  tilingGutter: number;
}
