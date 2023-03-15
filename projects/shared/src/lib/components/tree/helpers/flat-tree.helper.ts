import { MatTreeFlattener } from '@angular/material/tree';
import { TreeModel, FlatTreeModel } from '../models';

export class FlatTreeHelper {

  public static hasChildren = <T = any, TypeDef extends string = string>(node: TreeModel<T, TypeDef>): boolean => !!node.children && node.children.length > 0;
  public static getChildren = <T = any, TypeDef extends string = string>(node: TreeModel<T, TypeDef>): TreeModel<T, TypeDef>[] | undefined => node.children;
  public static getLevel = <T = any, TypeDef extends string = string>(node: FlatTreeModel<T, TypeDef>) => node.level;
  public static isExpandable = <T = any, TypeDef extends string = string>(node: FlatTreeModel<T, TypeDef>) => node.expandable;

  public static getTreeFlattener<T = any, TypeDef extends string = string>() {
    return new MatTreeFlattener(
      (node: TreeModel<T, TypeDef>, level: number) => FlatTreeHelper.transformer<T, TypeDef>(node, level),
      (node: FlatTreeModel<T, TypeDef>) => FlatTreeHelper.getLevel<T, TypeDef>(node),
      (node: FlatTreeModel<T, TypeDef>) => FlatTreeHelper.isExpandable<T, TypeDef>(node),
      (node: TreeModel<T, TypeDef>) => FlatTreeHelper.getChildren<T, TypeDef>(node),
    );
  }

  public static transformer<T = any, TypeDef extends string = string>(node: TreeModel<T, TypeDef>, level: number): FlatTreeModel<T, TypeDef> {
    return {
      id: node.id,
      label: node.label,
      level,
      expanded: !!node.expanded,
      expandable: typeof node.expandable !== 'undefined' ? node.expandable : FlatTreeHelper.hasChildren(node),
      checked: !!node.checked,
      checkbox: typeof node.checked !== 'undefined',
      type: node.type,
      metadata: node.metadata,
      loadingPlaceholder: node.loadingPlaceholder,
    };
  }

  public static getParentNode(node: FlatTreeModel, nodes: FlatTreeModel[]): FlatTreeModel | null {
    const currentLevel = FlatTreeHelper.getLevel(node);
    if (currentLevel < 1) {
      return null;
    }
    const startIndex = nodes.indexOf(node) - 1;
    for (let i = startIndex; i >= 0; i--) {
      const currentNode = nodes[i];
      if (FlatTreeHelper.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

}
