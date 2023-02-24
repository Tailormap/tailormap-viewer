export interface LayerTreeNodeModel {
  id: string;
  appLayerName?: string | null;
  root: boolean;
  name: string;
  childrenIds: string[] | null;
  description?: string;
}
