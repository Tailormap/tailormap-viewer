import { TreeService } from '../tree.service';
import { FlatTreeModel } from '../models';
import { DropZoneOptions } from '../tree-drag-drop.service';

export class DropZoneHelper {

  public static getDefaultDropZones(treeService: TreeService): (target: HTMLDivElement, node: FlatTreeModel) => DropZoneOptions[] {
    return (target: HTMLDivElement, node: FlatTreeModel) => [this.getDefaultDropZoneOptions(treeService, target, node)];
  }

  public static getDefaultDropZoneOptions(treeService: TreeService, target: HTMLDivElement, node: FlatTreeModel): DropZoneOptions {
    return {
      getTargetElement: () => target,
      dropAllowed: (nodeId) => treeService.hasNode(nodeId) && !treeService.isNodeOrInsideOwnTree(nodeId, node),
      dropInsideAllowed: (nodeId) => treeService.isExpandable(nodeId) && !treeService.isNodeOrInsideOwnTree(nodeId, node),
      isExpandable: (nodeId) => treeService.isExpandable(nodeId),
      isExpanded: (nodeId) => treeService.isExpanded(nodeId),
      expandNode: (nodeId) => treeService.expandNode(nodeId),
      getParent: (nodeId) => treeService.getParent(nodeId),
      nodePositionChanged: evt => treeService.nodePositionChanged(evt),
    };
  }

}
