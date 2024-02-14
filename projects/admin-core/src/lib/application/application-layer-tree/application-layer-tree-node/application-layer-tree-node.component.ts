import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TreeModel } from '@tailormap-viewer/shared';
import { AppTreeNodeModel } from '@tailormap-admin/admin-api';
import { ApplicationTreeHelper } from '../../helpers/application-tree.helper';

@Component({
  selector: 'tm-admin-application-layer-tree-node',
  templateUrl: './application-layer-tree-node.component.html',
  styleUrls: ['./application-layer-tree-node.component.css'],
})
export class ApplicationLayerTreeNodeComponent {

  @Input()
  public node: TreeModel<AppTreeNodeModel> | null = null;

  @Output()
  public addSubFolder = new EventEmitter<string>();

  @Output()
  public renameSubFolder = new EventEmitter<{ nodeId: string; title: string }>();

  @Output()
  public deleteNode = new EventEmitter<string>();

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
}
