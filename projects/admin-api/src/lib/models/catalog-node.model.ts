import { CatalogItemModel } from './catalog-item.model';

export interface CatalogNodeModel {
  id: string;
  title: string;
  root: boolean;
  children: string[] | null;
  items: CatalogItemModel[] | null;
}
