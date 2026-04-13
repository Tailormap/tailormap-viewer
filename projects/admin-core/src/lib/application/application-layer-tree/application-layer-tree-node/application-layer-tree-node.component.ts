import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { TreeModel, TreeService } from '@tailormap-viewer/shared';
import { AppTreeNodeModel } from '@tailormap-admin/admin-api';
import { ApplicationTreeHelper } from '../../helpers/application-tree.helper';

@Component({
  selector: 'tm-admin-application-layer-tree-node',
  templateUrl: './application-layer-tree-node.component.html',
  styleUrls: ['./application-layer-tree-node.component.css'],
  standalone: false,
})
export class ApplicationLayerTreeNodeComponent {
  private treeService = inject(TreeService);

  @Input()
  public node: TreeModel<AppTreeNodeModel> | null = null;

  @Input()
  public applicationStateTree: 'layer' | 'baseLayer' | 'terrainLayer' = 'layer';

  @Output()
  public addSubFolder = new EventEmitter<string>();

  @Output()
  public renameSubFolder = new EventEmitter<{ nodeId: string; title: string }>();

  @Output()
  public deleteNode = new EventEmitter<string>();

  @Output()
  public expandOnStartup = new EventEmitter<{ nodeId: string; expandOnStartup: "automatic" | "alwaysExpand" | "neverExpand" }>();

  public isLevel() {
    return this.node?.type === 'level';
  }

  public isLayer() {
    return this.node?.type === 'layer';
  }

  public addFolder($event: MouseEvent, nodeId: string) {
    $event.stopPropagation();
    this.addSubFolder.emit(nodeId);
  }

  public renameFolder($event: MouseEvent, nodeId: string, title: string) {
    $event.stopPropagation();
    this.renameSubFolder.emit({ nodeId, title });
  }

  public removeNode($event: MouseEvent, nodeId: string) {
    $event.stopPropagation();
    this.deleteNode.emit(nodeId);
  }

  public isNonRoot() {
    const isRoot = ApplicationTreeHelper.isLevelTreeNode(this.node) && this.node.metadata?.root;
    return !isRoot;
  }

  public getIcon() {
    if (this.isLevel()) {
      return 'folder_filled';
    } else if (this.applicationStateTree === 'terrainLayer') {
      return 'admin_terrain';
    }
    return 'admin_catalog';
  }

  public getExpandOnStartup() {
    if (ApplicationTreeHelper.isLevelTreeNode(this.node)) {
      return this.node.metadata?.expandOnStartup;
    }
    return "automatic";
  }

  public setExpandOnStartup(expandOnStartup: "automatic" | "alwaysExpand" | "neverExpand") {
    if (ApplicationTreeHelper.isLevelTreeNode(this.node)) {
      this.expandOnStartup.emit({ nodeId: this.node.id, expandOnStartup });
    }
  }

  public someChildrenChecked() {
    const node = this.treeService.getNode(this.node?.id || '');
    if (!node) {
      return false;
    }
    return this.treeService.descendantsPartiallySelected(node) || this.treeService.descendantsAllSelected(node);
  }

  public getExpandOnStartupTooltip() {
    return this.someChildrenChecked()
      ? $localize `:@@admin-core.application.expand-on-startup-disabled-tooltip:This group is expanded on startup, because a layer in the group is checked`
      : $localize `:@@admin-core.application.expand-on-startup-tooltip:Expand this group when the application is started`;
  }
}
