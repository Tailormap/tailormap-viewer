import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CatalogTreeModel } from '../../models/catalog-tree.model';
import { CatalogTreeModelTypeEnum } from '../../models/catalog-tree-model-type.enum';
import { CatalogTreeHelper } from '../../helpers/catalog-tree.helper';

@Component({
  selector: 'tm-admin-catalog-base-tree-node',
  templateUrl: './catalog-base-tree-node.component.html',
  styleUrls: ['./catalog-base-tree-node.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CatalogBaseTreeNodeComponent {

  private static readonly nodeLabel = {
    [CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE]: $localize `:@@admin-core.catalog.catalog:Catalog`,
    [CatalogTreeModelTypeEnum.SERVICE_TYPE]: $localize `:@@admin-core.catalog.service:Service`,
    [CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE]: $localize `:@@admin-core.catalog.layer:Layer`,
    [CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE]: $localize `:@@admin-core.catalog.feature-source:Feature Source`,
    [CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE]: $localize `:@@admin-core.catalog.feature-type:Feature type`,
    unknown: '',
  };

  private static readonly nodeIcon = {
    [CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE]: 'folder_filled',
    [CatalogTreeModelTypeEnum.SERVICE_TYPE]: 'admin_service',
    [CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE]: 'admin_catalog',
    [CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE]: 'admin_feature_source',
    [CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE]: 'admin_feature_type',
  };

  private _node: CatalogTreeModel | null = null;
  public nodeSettings: { label: string; icon: string } = { label: '', icon: '' };

  @Input()
  public set node(node: CatalogTreeModel | null) {
    this._node = node;
    this.nodeSettings.label = CatalogBaseTreeNodeComponent.nodeLabel[node?.type || 'unknown'] || '';
    this.nodeSettings.icon = CatalogBaseTreeNodeComponent.getNodeIcon(node);
  }
  public get node(): CatalogTreeModel | null {
    return this._node;
  }

  @Input()
  public selectable = false;

  @Input()
  public link: string | null = null;

  private static getNodeIcon(node: CatalogTreeModel | null) {
    if (!node || !node.metadata || !node.type) {
      return '';
    }
    if (CatalogTreeHelper.isFeatureSource(node)) {
      return node.metadata.protocol === 'WFS' ? 'admin_wfs' : 'admin_jdbc';
    }
    return CatalogBaseTreeNodeComponent.nodeIcon[node.type];
  }

}
