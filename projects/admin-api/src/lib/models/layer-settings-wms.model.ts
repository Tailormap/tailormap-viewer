import { LayerSettingsModel } from './layer-settings.model';
import { WmsStyleModel } from './wms-style.model';

export interface LayerSettingsWmsModel extends LayerSettingsModel {
  tilingDisabled?: boolean;
  tilingGutter?: number;
  selectedStyles?: WmsStyleModel[];
}
