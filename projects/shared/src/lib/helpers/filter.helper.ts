export interface NodeWithId {
  id: string;
}

export class FilterHelper {

  public static filterByTerm<T>(list: T[], filter: string | null | undefined, compareValue: (obj: T) => string): T[] {
    if (!filter) {
      return list;
    }
    const filterTerms = FilterHelper.createFilterTerms(filter);
    return list.filter(item => {
      return FilterHelper.matchesFilterTerm(filterTerms, compareValue(item));
    });
  }

  public static matchesFilterTerm(filterTerms: string[], text: string) {
    const lowerText = text.toLocaleLowerCase();
    return filterTerms.every(term => lowerText.indexOf(term) !== -1);
  }

  public static createFilterTerms(filterTerm: string): string[] {
    return filterTerm.trim().split(' ').map(f => f.toLocaleLowerCase());
  }

  public static getFilteredItemsAndParents<T extends NodeWithId>(
    allItems: T[],
    filteredItems: T[],
    getChildren: (node: T) => string[] | null | undefined,
  ): T[] {
    const filteredItemsSet = new Set(filteredItems.map(l => l.id));
    const allItemsMap = new Map(allItems.map(l => [ l.id, l ]));
    return allItems.filter(l => {
      return filteredItemsSet.has(l.id) || FilterHelper.hasFilteredChildren(l, allItemsMap, filteredItemsSet, getChildren);
    });
  }

  private static hasFilteredChildren<T extends NodeWithId>(
    node: T,
    allNodes: Map<string, T>,
    filteredNodes: Set<string>,
    getChildren: (node: T) => string[] | null | undefined,
  ): boolean {
    const children = getChildren(node);
    if (!children || children.length === 0) {
      return false;
    }
    return children.some(c => {
      const child = allNodes.get(c);
      if (!child) {
        return false;
      }
      if (filteredNodes.has(child.id)) {
        return true;
      }
      const childChildren = getChildren(child);
      if (childChildren && childChildren.length > 0) {
        return FilterHelper.hasFilteredChildren(child, allNodes, filteredNodes, getChildren);
      }
      return false;
    });
  }

}
