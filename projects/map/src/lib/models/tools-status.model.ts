export interface ToolWithOwner {
  toolId: string;
  owner: string;
}

export interface ToolsStatusModel {
  disabledTools: ToolWithOwner[];
  enabledTools: ToolWithOwner[];
}
