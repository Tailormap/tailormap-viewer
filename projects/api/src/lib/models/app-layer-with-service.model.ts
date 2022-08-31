import { AppLayerModel } from './app-layer.model';
import { ServiceModel } from './service.model';

export interface AppLayerWithServiceModel extends AppLayerModel {
  service?: ServiceModel;
}
