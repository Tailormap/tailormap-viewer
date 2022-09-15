import { AppLayerModel, ServiceModel } from '@tailormap-viewer/api';

export interface ExtendedAppLayerModel extends AppLayerModel {
  service?: ServiceModel;
  filter?: string;
}
