import { GetFeaturesApiModel } from './get-features-api.model';
import { GetLayerDetailsApiModel } from './get-layer-details-api.model';
import { Observable } from 'rxjs';

export interface DataSourceLayerModel {
  id: string;
  layerName: string;
  title: string;
  filterable: boolean;
  hasAttributes: boolean;
}

export interface DataSourceApiServiceModel
  extends GetFeaturesApiModel, GetLayerDetailsApiModel {
}

export interface DataSourceModel {
  id: string;
  availableLayers$: Observable<DataSourceLayerModel[]>;
  dataLoader: DataSourceApiServiceModel;
}
