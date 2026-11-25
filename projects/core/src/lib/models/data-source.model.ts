import { GetFeaturesApiModel } from './get-features-api.model';
import { GetLayerDetailsApiModel } from './get-layer-details-api.model';
import { Observable } from 'rxjs';

export interface DataSourceLayerModel {
  id: string;
  layerName: string;
  title: string;
  filterable: boolean;
  hasAttributes: boolean;
  /**
   * When set, feature info queries this layer through its data loader with a point query (`x`, `y`, `distance`).
   */
  featureInfo?: boolean;
}

/**
 * Id of the data source for layers of the tailormap-api backend.
 */
export const DEFAULT_DATA_SOURCE_ID = 'tm-default-layers';

export interface DataSourceApiServiceModel
  extends GetFeaturesApiModel, GetLayerDetailsApiModel {
}

export interface DataSourceModel {
  id: string;
  availableLayers$: Observable<DataSourceLayerModel[]>;
  dataLoader: DataSourceApiServiceModel;
}
