import { default as OlMap } from 'ol/Map';
import { ToolModel, ToolConfigModel, ToolManagerModel } from '../models';
import { ToolTypeHelper } from '../helpers/tool-type.helper';
import { OpenLayersMapClickTool } from './tools/open-layers-map-click-tool';
import { NgZone } from '@angular/core';

export class OpenLayersToolManager implements ToolManagerModel {

  private static toolIdCount = 0;
  private tools: Map<string, ToolModel> = new Map();
  private previouslyActiveTools: string[] = [];

  constructor(private olMap: OlMap, private ngZone: NgZone) {}

  public destroy() {
    const toolIds = Array.from(this.tools.keys());
    this.previouslyActiveTools = [];
    toolIds.forEach(id => this.removeTool(id));
  }

  public addTool(tool: ToolConfigModel): string {
    const toolId = `${tool.type.toLowerCase()}-${++OpenLayersToolManager.toolIdCount}`;
    if (ToolTypeHelper.isMapClickTool(tool)) {
      this.tools.set(toolId, new OpenLayersMapClickTool(tool));
    }
    return toolId;
  }

  public getTool<T extends ToolModel>(toolId: string): T | null {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return null;
    }
    return tool as T;
  }

  public disableTool(toolId: string): void {
    this.tools.get(toolId)?.disable();
    this.enablePreviousTools();
  }

  public enableTool(toolId: string, disableOtherTools?: boolean): void {
    if (disableOtherTools) {
      this.tools.forEach((tool, id) => {
        if (tool.isActive) {
          this.previouslyActiveTools.push(id);
          tool.disable();
        }
      });
    }
    this.tools.get(toolId)?.enable();
  }

  public removeTool(toolId: string): void {
    this.tools.get(toolId)?.destroy();
    this.tools.delete(toolId);
    this.enablePreviousTools();
  }

  private enablePreviousTools() {
    if (this.previouslyActiveTools.length === 0) {
      return;
    }
    this.previouslyActiveTools.forEach(tool => this.enableTool(tool));
    this.previouslyActiveTools = [];
  }

}
