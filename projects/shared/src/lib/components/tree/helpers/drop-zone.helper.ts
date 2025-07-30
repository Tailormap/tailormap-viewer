import { TreeService } from '../tree.service';
import { FlatTreeModel } from '../models';
import { DropZoneOptions } from '../tree-drag-drop.service';

export class DropZoneHelper {

  public static getDefaultDropZones(treeService: TreeService, useExtendedDropzone?: boolean): (target: HTMLElement, node?: FlatTreeModel) => DropZoneOptions[] {
    return (target: HTMLElement, node?: FlatTreeModel) => [this.getDefaultDropZoneOptions(treeService, target, node, useExtendedDropzone)];
  }

  public static getDefaultDropZoneOptions(
    treeService: TreeService,
    target: HTMLElement,
    node?: FlatTreeModel,
    useExtendedDropzone?: boolean,
  ): DropZoneOptions {
    return {
      getTargetElement: () => target,
      dropAllowed: (nodeId) => treeService.hasNode(nodeId) && !!node && !treeService.isNodeOrInsideOwnTree(nodeId, node),
      dropInsideAllowed: (nodeId) => treeService.isExpandable(nodeId) && !!node && !treeService.isNodeOrInsideOwnTree(nodeId, node),
      isExpandable: (nodeId) => treeService.isExpandable(nodeId),
      isExpanded: (nodeId) => treeService.isExpanded(nodeId),
      expandNode: (nodeId) => treeService.expandNode(nodeId),
      getParent: (nodeId) => treeService.getParent(nodeId),
      nodePositionChanged: evt => treeService.nodePositionChanged(evt),
      getExtendedDropzoneElement: useExtendedDropzone
        ? () => document.querySelector('.application-tree .extended-dropzone')
        : undefined,
      getRootNodeId: useExtendedDropzone
        ? () => treeService.getRootNodeId() || null
        : undefined,
    };
  }

}
