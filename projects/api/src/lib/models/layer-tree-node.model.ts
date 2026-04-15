export enum ExpandOnStartupEnum {
  AUTOMATIC = "automatic",
  ALWAYS_EXPAND = "alwaysExpand",
  NEVER_EXPAND = "neverExpand",
}

export interface LayerTreeNodeModel {
  id: string;
  appLayerId?: string | null;
  root: boolean;
  name: string;
  childrenIds: string[] | null;
  description?: string;
  webMercatorAvailable?: boolean;
  expandOnStartup?: ExpandOnStartupEnum;
}
