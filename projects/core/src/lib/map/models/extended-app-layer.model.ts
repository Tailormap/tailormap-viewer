import { AppLayerModel, ServiceModel } from '@tailormap-viewer/api';

/**
 * Extended version of AppLayerModel with:
 *  - initial values as fetched from the API.
 *  - temporaryLayerName to temporarily change the layer name (WMS only), for example to use for filtering objects on the map.
 *  - origin: who owns the layer. Absent means 'service': a layer from the application configuration, backed by a service.
 *    A 'user' layer has no backend service (for example a file the user added in the browser): it is shown in the layer tree and
 *    legend, but selectors that query a backend (feature info, attribute list, editing, search) and bookmarks skip it.
 */
export interface AppLayerStateModel extends AppLayerModel {
  initialValues?: {
    visible: boolean;
    opacity: number;
    style?: string | null;
  };
  temporaryLayerName?: string; // WMS only
  origin?: 'service' | 'user';
}

export interface ExtendedAppLayerModel extends AppLayerStateModel {
  service?: ServiceModel;
  filter?: string | null;
}
