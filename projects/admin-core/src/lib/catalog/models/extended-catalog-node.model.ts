import { CatalogNodeModel } from '@tailormap-admin/admin-api';

export interface ExtendedCatalogNodeModel extends CatalogNodeModel {
  parentId: string | null;
  expanded?: boolean;
}
