import { ExtendedAppLayerModel } from '../../../map/models';

export interface LegendInfoModel {
  layer: ExtendedAppLayerModel;
  url: string;
  isInScale: boolean;
}
