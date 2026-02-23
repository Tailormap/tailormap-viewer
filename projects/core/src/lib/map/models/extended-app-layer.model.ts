import { AppLayerModel, ServiceModel } from '@tailormap-viewer/api';

/**
 * Extended version of AppLayerModel with:
 *  - initial values as fetched from the API.
 *  - temporaryLayerName to temporarily change the layer name (WMS only), for example to use for filtering objects on the map.
 */
export interface AppLayerStateModel extends AppLayerModel {
  initialValues?: {
    visible: boolean;
    opacity: number;
  };
  temporaryLayerName?: string; // WMS only
}

export interface ExtendedAppLayerModel extends AppLayerStateModel {
  service?: ServiceModel;
  filter?: string | null;
}
