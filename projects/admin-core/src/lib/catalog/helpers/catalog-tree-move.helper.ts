import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { MoveCatalogNodeModel } from '../models/move-catalog-node.model';
import { CatalogItemKindEnum, CatalogItemModel } from '@tailormap-admin/admin-api';
import { ChangePositionHelper } from '@tailormap-viewer/shared';

export class CatalogTreeMoveHelper {

  public static moveNode(catalog: ExtendedCatalogNodeModel[], param: MoveCatalogNodeModel): ExtendedCatalogNodeModel[] | null {
    if (param.position === 'inside') {
      return CatalogTreeMoveHelper.moveNodeInsideNode(catalog, param);
    }
    return CatalogTreeMoveHelper.moveNodeBetweenNodes(catalog, param);
  }

  public static moveNodeInsideNode(catalog: ExtendedCatalogNodeModel[], param: MoveCatalogNodeModel): ExtendedCatalogNodeModel[] {
    if (param.siblingType !== 'node' || param.sibling === param.fromParent) {
      return catalog;
    }
    const isItemMethod = CatalogTreeMoveHelper.filterCatalogItem(param.node, param.nodeType);
    return catalog.map(node => {
      if (node.id === param.sibling) {
        if (param.nodeType === 'node') {
          return { ...node, children: [ ...(node.children || []), param.node ] };
        }
        if (param.nodeType === CatalogItemKindEnum.GEO_SERVICE || param.nodeType === CatalogItemKindEnum.FEATURE_SOURCE) {
          return { ...node, items: [ ...(node.items || []), { id: param.node, kind: param.nodeType }] };
        }
      }
      if (node.id === param.fromParent) {
        if (param.nodeType === 'node') {
          return { ...node, children: (node.children || []).filter(c => c !== param.node) };
        }
        if (param.nodeType === CatalogItemKindEnum.GEO_SERVICE || param.nodeType === CatalogItemKindEnum.FEATURE_SOURCE) {
          return { ...node, items: (node.items || []).filter(isItemMethod) };
        }
      }
      return node;
    });
  }

  public static moveNodeBetweenNodes(catalog: ExtendedCatalogNodeModel[], param: MoveCatalogNodeModel): ExtendedCatalogNodeModel[] | null {
    if (param.node === param.sibling) {
      return null;
    }
    const isItemMethod = CatalogTreeMoveHelper.filterCatalogItem(param.node, param.nodeType);
    return catalog.map(node => {
      if (node.id !== param.fromParent && node.id !== param.toParent) {
        return node;
      }
      const updatedNode = { ...node };
      if (param.nodeType === 'node') {
        if (node.id === param.fromParent) {
          updatedNode.children = (node.children || []).filter(c => c !== param.node);
        }
        if (node.id === param.toParent) {
          if (param.siblingType !== 'node') {
            // Folders can't be dragged between services/feature sources, move to last position
            updatedNode.children = [ ...(node.children || []), param.node ];
          } else {
            updatedNode.children = ChangePositionHelper.updateOrderInList(updatedNode.children || [], param.node, param.position, param.sibling);
          }
        }
      } else {
        if (node.id === param.fromParent) {
          updatedNode.items = (node.items || []).filter(isItemMethod);
        }
        if (node.id === param.toParent) {
          if (param.siblingType === 'node') {
            // Services/feature dragged between folders, move to first position
            updatedNode.items = [{ id: param.node, kind: param.nodeType }, ...(node.items || []) ];
          } else {
            const nodeItem: CatalogItemModel = { id: param.node, kind: param.nodeType };
            const siblingItem: CatalogItemModel = { id: param.sibling, kind: param.siblingType };
            updatedNode.items = ChangePositionHelper.updateOrderInList(updatedNode.items || [], nodeItem, param.position, siblingItem, (item, search) => {
              return item.id === search.id && item.kind === search.kind;
            });
          }
        }
      }
      return updatedNode;
    });
  }

  private static filterCatalogItem(id: string, kind: string | CatalogItemKindEnum) {
    return (item: CatalogItemModel) => item.id !== id || item.kind !== kind;
  }

}
