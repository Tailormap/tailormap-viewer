import { TreeService } from '../tree.service';
import { FlatTreeModel } from '../models';
import { DropZoneOptions } from '../tree-drag-drop.service';

export class DropZoneHelper {

  public static getDefaultDropZones(treeService: TreeService): (target: HTMLElement, node?: FlatTreeModel) => DropZoneOptions[] {
    return (target: HTMLElement, node?: FlatTreeModel, dragNodeIds?: string[]) => [this.getDefaultDropZoneOptions(treeService, target, node, dragNodeIds)];
  }

  public static getDefaultDropZoneOptions(
    treeService: TreeService,
    target: HTMLElement,
    node?: FlatTreeModel,
    dragNodeIds: string[] = [],
  ): DropZoneOptions {
    const draggedNodeIds = dragNodeIds.length > 0
      ? dragNodeIds
      : (node ? [node.id] : []);
    return {
      getTargetElement: () => target,
      dropAllowed: (nodeId) => treeService.hasNode(nodeId) && !!node && !treeService.isAnyNodeOrInsideOwnTree(nodeId, draggedNodeIds),
      dropInsideAllowed: (nodeId) => treeService.isExpandable(nodeId) && !!node && !treeService.isAnyNodeOrInsideOwnTree(nodeId, draggedNodeIds),
      isExpandable: (nodeId) => treeService.isExpandable(nodeId),
      isExpanded: (nodeId) => treeService.isExpanded(nodeId),
      expandNode: (nodeId) => treeService.expandNode(nodeId),
      getParent: (nodeId) => treeService.getParent(nodeId),
      nodePositionChanged: evt => treeService.nodePositionChanged(evt),
    };
  }

}
