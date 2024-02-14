import { FeatureSourceModel } from './feature-source.model';
import { FeatureTypeModel } from './feature-type.model';

export interface FeatureSourceWithFeatureTypesModel extends FeatureSourceModel {
  allFeatureTypes: FeatureTypeModel[];
}
