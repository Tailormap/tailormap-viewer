import { ToolModel } from './tools/tool.model';

export interface ToolManagerModel {
  addTool(tool: ToolModel): string;
  enableTool(toolId: string, disableOtherTools?: boolean): void;
  disableTool(toolId: string): void;
  removeTool(toolId: string): void;
  destroy(): void;
}
