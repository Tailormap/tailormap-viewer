import { Observable } from 'rxjs';
import { GetFeaturesApiModel } from '../../models/get-features-api.model';
import { GetLayerDetailsApiModel } from '../../models/get-layer-details-api.model';

export interface FilterableLayerModel {
  id: string;
  label: string;
  filterable: boolean;
  referencable: boolean;
}

export interface FilterApiServiceModel
  extends GetFeaturesApiModel, GetLayerDetailsApiModel {
}

export interface FilterSourceModel {
  id: string;
  availableLayers$: Observable<FilterableLayerModel[]>;
  dataLoader: FilterApiServiceModel;
}
