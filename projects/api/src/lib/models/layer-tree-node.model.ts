export interface LayerTreeNodeModel {
  id: string;
  appLayerId?: string | null;
  root: boolean;
  name: string;
  childrenIds: string[] | null;
  description?: string;
  webMercatorAvailable?: boolean;
}
