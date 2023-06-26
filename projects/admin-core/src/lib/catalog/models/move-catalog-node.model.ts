import { CatalogItemKindEnum } from '@tailormap-admin/admin-api';

export interface MoveCatalogNodeModel {
  node: string;
  nodeType: 'node' | CatalogItemKindEnum;
  fromParent: string;
  toParent: string;
  sibling: string;
  siblingType: 'node' | CatalogItemKindEnum;
  position: 'before' | 'after' | 'inside';
}
