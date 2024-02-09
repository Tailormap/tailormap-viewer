export enum CatalogExtendedTypeEnum {
  CATALOG_NODE_TYPE = 'catalog-node',
  SERVICE_TYPE = 'geo-service',
  SERVICE_LAYER_TYPE = 'service-layer',
  FEATURE_SOURCE_TYPE = 'feature-source',
  FEATURE_TYPE_TYPE = 'feature-type',
}

export interface CatalogExtendedModel {
  id: string;
  type: CatalogExtendedTypeEnum;
  title: string;
}
