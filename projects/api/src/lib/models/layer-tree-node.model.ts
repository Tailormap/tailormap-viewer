export interface LayerTreeNodeModel {
  id: string;
  appLayerId?: number | null;
  root: boolean;
  name: string;
  childrenIds: string[] | null;
  description?: string;
}
