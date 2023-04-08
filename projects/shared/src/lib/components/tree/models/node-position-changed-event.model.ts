export type TreeNodePosition = 'before' | 'after' | 'inside';

export interface NodePositionChangedEventModel {
  nodeId: string;
  fromParent: string | null;
  toParent: string | null;
  sibling: string;
  position: TreeNodePosition;
}
