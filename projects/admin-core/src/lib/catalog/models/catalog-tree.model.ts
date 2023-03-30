import { TreeModel } from '@tailormap-viewer/shared';
import { ExtendedCatalogNodeModel } from './extended-catalog-node.model';
import { ExtendedGeoServiceLayerModel } from './extended-geo-service-layer.model';
import { ExtendedGeoServiceModel } from './extended-geo-service.model';
import { CatalogTreeModelTypeEnum } from './catalog-tree-model-type.enum';
import { ExtendedFeatureSourceModel } from './extended-feature-source.model';
import { ExtendedFeatureTypeModel } from './extended-feature-type.model';

export type CatalogTreeModelMetadataTypes = ExtendedCatalogNodeModel
  | ExtendedGeoServiceModel
  | ExtendedGeoServiceLayerModel
  | ExtendedFeatureSourceModel
  | ExtendedFeatureTypeModel;

export type CatalogTreeModel = TreeModel<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>;
