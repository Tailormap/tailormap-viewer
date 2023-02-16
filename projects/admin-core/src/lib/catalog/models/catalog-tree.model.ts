import { FeatureSourceModel } from '@tailormap-admin/admin-api';
import { TreeModel } from '@tailormap-viewer/shared';
import { ExtendedCatalogNodeModel } from './extended-catalog-node.model';
import { ExtendedGeoServiceLayerModel } from './extended-geo-service-layer.model';
import { ExtendedGeoServiceModel } from './extended-geo-service.model';
import { CatalogTreeModelTypeEnum } from './catalog-tree-model-type.enum';

export type CatalogTreeModelMetadataTypes = ExtendedCatalogNodeModel | ExtendedGeoServiceModel | ExtendedGeoServiceLayerModel | FeatureSourceModel;
export type CatalogTreeModel = TreeModel<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>;
