import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TreeModel } from '@tailormap-viewer/shared';
import { FormControl } from '@angular/forms';
import { ApplicationModelHelper } from '../../helpers/application-model.helper';
import { AppTreeNodeModel } from '@tailormap-admin/admin-api';

@Component({
  selector: 'tm-admin-application-layer-tree-node',
  templateUrl: './application-layer-tree-node.component.html',
  styleUrls: ['./application-layer-tree-node.component.css'],
})
export class ApplicationLayerTreeNodeComponent {

  private _node: TreeModel<AppTreeNodeModel> | null = null;

  @Input()
  public set node(node: TreeModel<AppTreeNodeModel> | null) {
    this._node = node;
    if (node?.metadata && ApplicationModelHelper.isLevelTreeNode(node?.metadata)) {
      this.nameControl.patchValue(node.metadata.title, { emitEvent: false });
    }
  }
  public get node(): TreeModel<AppTreeNodeModel> | null {
    return this._node;
  }

  @Output()
  public addSubFolder = new EventEmitter<string>();

  @Output()
  public folderNameChanged = new EventEmitter<string>();

  public showFormControl = false;

  public nameControl = new FormControl('');

  constructor() {
    this.nameControl.valueChanges.subscribe(value => {
      if (!value) {
        return;
      }
      this.folderNameChanged.emit(value);
    });
  }

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

  public showNameInput($event: MouseEvent) {
    $event.stopPropagation();
    if (!this.node?.metadata || !ApplicationModelHelper.isLevelTreeNode(this.node?.metadata) || this.node?.metadata?.root) {
      return;
    }
    this.showFormControl = true;
  }

  public hideNameInput() {
    this.showFormControl = false;
  }

}
