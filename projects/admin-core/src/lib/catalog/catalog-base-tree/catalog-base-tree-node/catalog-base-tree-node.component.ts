import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CatalogTreeModel } from '../../models/catalog-tree.model';
import { CatalogTreeModelTypeEnum } from '../../models/catalog-tree-model-type.enum';
import { CatalogTreeHelper } from '../../helpers/catalog-tree.helper';
import { ExtendedFeatureTypeModel } from '../../models/extended-feature-type.model';
import { GeoServiceProtocolEnum } from '@tailormap-admin/admin-api';

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
  public nodeSettings: { label: string; icon: string; warningMsg: string } = { label: '', icon: '', warningMsg: '' };

  @Input()
  public set node(node: CatalogTreeModel | null) {
    this._node = node;
    this.nodeSettings.label = CatalogBaseTreeNodeComponent.nodeLabel[node?.type || 'unknown'] || '';
    this.nodeSettings.icon = CatalogBaseTreeNodeComponent.getNodeIcon(node);

    const warnings = [];
    if (node?.type === CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE && node.metadata ) {
      const metadata: ExtendedFeatureTypeModel = node.metadata as ExtendedFeatureTypeModel;

      if (metadata.defaultGeometryAttribute === null) {
        warnings.push($localize `:@@admin-core.catalog.feature-type-no-default-geom-warning:This feature type does not have a geometry attribute.`);
      }
      if (metadata.featureSourceProtocol !== 'WFS' && metadata.primaryKeyAttribute === null) {
         warnings.push($localize `:@@admin-core.catalog.feature-type-no-pk-warning:This feature type does not have a primary key.`);
      }
    }
    this.nodeSettings.warningMsg = warnings.join('\n');
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
    if (CatalogTreeHelper.isLayerNode(node) && node.metadata.protocol === GeoServiceProtocolEnum.QUANTIZEDMESH) {
      return 'admin_terrain';
    }
    return CatalogBaseTreeNodeComponent.nodeIcon[node.type];
  }
}
