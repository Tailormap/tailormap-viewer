import { CatalogNodeModel, FeatureSourceModel, GeoServiceLayerModel, GeoServiceModel } from '@tailormap-admin/admin-api';
import { TreeModel } from '@tailormap-viewer/shared';

export type CatalogTreeModel = TreeModel<CatalogNodeModel | GeoServiceModel | GeoServiceLayerModel | FeatureSourceModel>;
