import { FeatureSourceModel } from '@tailormap-admin/admin-api';
import { TreeModel } from '@tailormap-viewer/shared';
import { ExtendedCatalogNodeModel } from './extended-catalog-node.model';
import { ExtendedGeoServiceLayerModel } from './extended-geo-service-layer.model';
import { ExtendedGeoServiceModel } from './extended-geo-service.model';

export type CatalogTreeModel = TreeModel<ExtendedCatalogNodeModel | ExtendedGeoServiceModel | ExtendedGeoServiceLayerModel | FeatureSourceModel>;
