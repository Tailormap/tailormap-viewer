import { ToolConfigModel } from './tools/tool-config.model';
import { ToolModel } from './tools/tool.model';

export interface ToolManagerModel {
  addTool(tool: ToolConfigModel): string;
  getTool<T extends ToolModel>(toolId: string): T | null;
  enableTool(toolId: string, disableOtherTools?: boolean): void;
  disableTool(toolId: string): void;
  removeTool(toolId: string): void;
  destroy(): void;
}
