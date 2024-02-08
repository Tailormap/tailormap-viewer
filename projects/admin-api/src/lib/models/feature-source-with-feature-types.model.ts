import { FeatureSourceModel, FeatureTypeModel } from '@tailormap-admin/admin-api';

export interface FeatureSourceWithFeatureTypesModel extends FeatureSourceModel {
  allFeatureTypes: FeatureTypeModel[];
}
