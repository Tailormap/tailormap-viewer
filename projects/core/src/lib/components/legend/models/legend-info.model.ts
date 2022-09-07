import { AppLayerWithServiceModel } from '../../../map/models';

export interface LegendInfoModel {
  layer: AppLayerWithServiceModel;
  url: string;
  isInScale: boolean;
}
