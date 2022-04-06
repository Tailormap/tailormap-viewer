export interface LayerTreeNodeModel {
  id: string;
  appLayerId?: number;
  root: boolean;
  name: string;
  childrenIds: string[];
}
