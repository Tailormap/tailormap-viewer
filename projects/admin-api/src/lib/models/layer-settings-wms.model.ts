import { LayerSettingsModel } from './layer-settings.model';

export interface LayerSettingsWmsModel extends LayerSettingsModel {
  tilingDisabled?: boolean;
  tilingGutter?: number;
}
