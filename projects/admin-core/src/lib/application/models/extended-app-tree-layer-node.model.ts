import { ExtendedGeoServiceModel } from '../../catalog/models/extended-geo-service.model';
import { ExtendedFeatureTypeModel } from '../../catalog/models/extended-feature-type.model';
import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';
import { AppLayerSettingsModel, AppTreeLayerNodeModel } from '@tailormap-admin/admin-api';

export interface ExtendedAppTreeLayerNodeModel extends AppTreeLayerNodeModel {
  label: string;
  appLayerSettings: AppLayerSettingsModel;
  geoService: ExtendedGeoServiceModel | undefined;
  geoServiceLayer: ExtendedGeoServiceLayerModel | undefined;
  featureType: ExtendedFeatureTypeModel | undefined;
}
