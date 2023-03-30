import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CatalogTreeModel } from '../../models/catalog-tree.model';
import { CatalogTreeModelTypeEnum } from '../../models/catalog-tree-model-type.enum';
import { CatalogTreeHelper } from '../../helpers/catalog-tree.helper';

@Component({
  selector: 'tm-admin-catalog-tree-node',
  templateUrl: './catalog-tree-node.component.html',
  styleUrls: ['./catalog-tree-node.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogTreeNodeComponent {

  private static readonly nodeLabel = {
    [CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE]: $localize `Catalog`,
    [CatalogTreeModelTypeEnum.SERVICE_TYPE]: $localize `Service`,
    [CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE]: $localize `Layer`,
    [CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE]: $localize `Feature Source`,
    [CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE]: $localize `Feature Type`,
    unknown: '',
  };

  private static readonly nodeIcon = {
    [CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE]: 'folder_filled',
    [CatalogTreeModelTypeEnum.SERVICE_TYPE]: 'admin_service',
    [CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE]: 'admin_catalog',
    [CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE]: 'admin_feature_source',
    [CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE]: 'admin_feature_type',
    unknown: '',
  };

  private _node: CatalogTreeModel | null = null;
  public nodeSettings: { label: string; icon: string; selectable: boolean; link: string | null } = { label: '', icon: '', selectable: false, link: null };

  @Input()
  public set node(node: CatalogTreeModel | null) {
    this._node = node;
    this.nodeSettings.label = CatalogTreeNodeComponent.nodeLabel[node?.type || 'unknown'] || '';
    this.nodeSettings.icon = CatalogTreeNodeComponent.nodeIcon[node?.type || 'unknown'] || '';
    this.nodeSettings.selectable = CatalogTreeHelper.isNodeWithRoute(node);
    this.nodeSettings.link = CatalogTreeHelper.getRouterLink(node);
  }
  public get node(): CatalogTreeModel | null {
    return this._node;
  }

}
