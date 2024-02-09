import { CatalogNodeModel } from '@tailormap-admin/admin-api';
import { CatalogExtendedModel, CatalogExtendedTypeEnum } from './catalog-extended.model';

export interface ExtendedCatalogNodeModel extends CatalogNodeModel, CatalogExtendedModel {
  type: CatalogExtendedTypeEnum.CATALOG_NODE_TYPE;
  parentId: string | null;
  expanded?: boolean;
}
