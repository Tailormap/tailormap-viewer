export class TreeHelper {

  public static traverseTree<T, N extends { id: string }>(
    nodes: N[],
    id: string,
    transformer: (node: N, children: T[]) => T | null,
    getChildren: (node: N) => string[],
  ): T | null {
    const node = TreeHelper.findNode(nodes, id);
    if (!node) {
      return null;
    }
    const childNodes: string[] = getChildren(node);
    const children = childNodes
      .map(childId => TreeHelper.traverseTree<T, N>(nodes, childId, transformer, getChildren))
      .filter<T>((n): n is T => !!n);
    return transformer(node, children);
  }

  public static findNode<N extends { id: string }>(nodes: N[], id: string) {
    return nodes.find(l => l.id === id);
  }

}
