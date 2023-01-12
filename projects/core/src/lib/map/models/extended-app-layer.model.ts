import { AppLayerModel, ServiceModel } from '@tailormap-viewer/api';

/**
 * Extended version of AppLayerModel that stores the initial values seen for this object.
 */
export interface AppLayerWithInitialValuesModel extends AppLayerModel {
  initialValues?: {
    visible: boolean;
    opacity: number;
  };
}

export interface ExtendedAppLayerModel extends AppLayerWithInitialValuesModel {
  service?: ServiceModel;
  filter?: string;
}
