import { ToolConfigModel } from './tools/tool-config.model';
import { ToolModel } from './tools/tool.model';
import { Scene } from 'cesium';
import { Observable } from 'rxjs';

export interface ToolManagerModel {
  addTool<T extends ToolModel, C extends ToolConfigModel>(tool: C, scene3D?: Scene, in3D$?: Observable<boolean>): T;
  getTool<T extends ToolModel>(toolId: string): T | null;
  enableTool<T = Record<string, unknown>>(toolId: string, disableOtherTools?: boolean, enableArgs?: T): ToolManagerModel;
  disableTool(toolId: string, preventAutoEnableTools?: boolean): ToolManagerModel;
  removeTool(toolId: string): ToolManagerModel;
  destroy(): void;
}
