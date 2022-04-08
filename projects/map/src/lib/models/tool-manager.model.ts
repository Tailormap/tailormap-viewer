import { ToolConfigModel } from './tools/tool-config.model';
import { ToolModel } from './tools/tool.model';

export interface ToolManagerModel {
  addTool<T extends ToolModel, C extends ToolConfigModel>(tool: C): T | null;
  getTool<T extends ToolModel>(toolId: string): T | null;
  enableTool<T extends Record<string, unknown>>(toolId: string, disableOtherTools?: boolean, enableArgs?: T): ToolManagerModel;
  disableTool(toolId: string): ToolManagerModel;
  removeTool(toolId: string): ToolManagerModel;
  destroy(): void;
}
