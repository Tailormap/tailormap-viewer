import { AppLayerModel } from '../../../../../api/src/lib/models/app-layer.model';
import { ServiceModel } from '../../../../../api/src/lib/models/service.model';

export interface AppLayerWithServiceModel extends AppLayerModel {
  service?: ServiceModel;
}
