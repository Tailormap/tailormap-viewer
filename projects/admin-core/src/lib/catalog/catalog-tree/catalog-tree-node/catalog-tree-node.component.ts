import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CatalogTreeModel } from '../../models/catalog-tree.model';
import { CatalogTreeModelTypeEnum } from '../../models/catalog-tree-model-type.enum';
import { CatalogHelper } from '../../helpers/catalog.helper';

@Component({
  selector: 'tm-admin-catalog-tree-node',
  templateUrl: './catalog-tree-node.component.html',
  styleUrls: ['./catalog-tree-node.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogTreeNodeComponent {

  @Input()
  public node: CatalogTreeModel | null = null;

  constructor() { }

  public isCatalogNode() {
    return this.node?.type === CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE;
  }

  public isServiceNode() {
    return this.node?.type === CatalogTreeModelTypeEnum.SERVICE_TYPE;
  }

  public isLayerNode() {
    return this.node?.type === CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE;
  }

  public isSelectable() {
    if (!this.node) {
      return false;
    }
    return this.isCatalogNode()
      || this.isServiceNode()
      || (CatalogHelper.isLayerNode(this.node) && !this.node?.metadata?.virtual);
  }

}
