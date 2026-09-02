import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CatalogTreeModel } from '../../models/catalog-tree.model';
import { CatalogTreeHelper } from '../../helpers/catalog-tree.helper';
import { CatalogBaseTreeNodeComponent } from '../../catalog-base-tree/catalog-base-tree-node/catalog-base-tree-node.component';

@Component({
    selector: 'tm-admin-catalog-tree-node',
    templateUrl: './catalog-tree-node.component.html',
    styleUrls: ['./catalog-tree-node.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CatalogBaseTreeNodeComponent],
})
export class CatalogTreeNodeComponent {

  private _node: CatalogTreeModel | null = null;
  public nodeSettings: { selectable: boolean; link: string | null } = { selectable: false, link: null };

  @Input()
  public set node(node: CatalogTreeModel | null) {
    this._node = node;
    this.nodeSettings.selectable = CatalogTreeHelper.isNodeWithRoute(node);
    this.nodeSettings.link = CatalogTreeHelper.getRouterLink(node);
  }
  public get node(): CatalogTreeModel | null {
    return this._node;
  }

}
