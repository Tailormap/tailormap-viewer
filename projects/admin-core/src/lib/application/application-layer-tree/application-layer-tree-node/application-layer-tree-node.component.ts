import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TreeModel } from '@tailormap-viewer/shared';
import { AppTreeNodeModel } from '@tailormap-admin/admin-api';

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

  public addFolder(nodeId: string) {
    this.addSubFolder.emit(nodeId);
  }

  public renameFolder(nodeId: string, title: string) {
    this.renameSubFolder.emit({ nodeId, title });
  }

  public removeNode(nodeId: string) {
    this.deleteNode.emit(nodeId);
  }

}
