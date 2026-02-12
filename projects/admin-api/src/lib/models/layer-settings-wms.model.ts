import { LayerSettingsModel } from './layer-settings.model';
import { WmsStyleModel } from '@tailormap-viewer/api';

export interface LayerSettingsWmsModel extends LayerSettingsModel {
  tilingDisabled?: boolean;
  tilingGutter?: number;
  selectedStyles?: WmsStyleModel[];
}
