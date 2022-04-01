import { default as OlMap } from 'ol/Map';
import { ToolModel, ToolConfigModel, ToolManagerModel } from '../models';
import { ToolTypeHelper } from '../helpers/tool-type.helper';
import { OpenLayersMapClickTool } from './tools/open-layers-map-click-tool';
import { NgZone } from '@angular/core';
import { OpenLayersDrawingTool } from './tools/open-layers-drawing-tool';

export class OpenLayersToolManager implements ToolManagerModel {

  private static toolIdCount = 0;
  private tools: Map<string, ToolModel> = new Map();

  private autoEnabledTools = new Set<string>();
  private alwaysEnabledTools = new Set<string>();

  constructor(private olMap: OlMap, private ngZone: NgZone) {}

  public destroy() {
    const toolIds = Array.from(this.tools.keys());
    this.autoEnabledTools = new Set();
    this.alwaysEnabledTools = new Set();
    toolIds.forEach(id => this.removeTool(id));
  }

  public addTool<T extends ToolModel, C extends ToolConfigModel>(tool: C): T | null {
    const toolId = `${tool.type.toLowerCase()}-${++OpenLayersToolManager.toolIdCount}`;
    if (ToolTypeHelper.isMapClickTool(tool)) {
      this.tools.set(toolId, new OpenLayersMapClickTool(toolId, tool));
    }
    if (ToolTypeHelper.isDrawingTool(tool)) {
      this.tools.set(toolId, new OpenLayersDrawingTool(toolId, tool, this.olMap, this.ngZone));
    }
    if (tool.alwaysEnabled) {
      this.alwaysEnabledTools.add(toolId);
    }
    if (tool.autoEnable) {
      this.autoEnabledTools.add(toolId);
    }
    if (tool.alwaysEnabled || tool.autoEnable) {
      this.enableTool(toolId);
    }
    return this.getTool<T>(toolId);
  }

  public getTool<T extends ToolModel>(toolId: string): T | null {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return null;
    }
    return tool as T;
  }

  public disableTool(toolId: string): ToolManagerModel {
    this.tools.get(toolId)?.disable();
    this.enableAutoEnabledTools();
    return this;
  }

  public enableTool(
    toolId: string,
    disableOtherTools?: boolean,
    enableArgs?: any,
  ): ToolManagerModel {
    if (disableOtherTools) {
      this.tools.forEach((tool) => {
        if (tool.isActive && !this.alwaysEnabledTools.has(tool.id)) {
          tool.disable();
        }
      });
    }
    this.tools.get(toolId)?.enable(enableArgs);
    return this;
  }

  public removeTool(toolId: string): ToolManagerModel {
    this.tools.get(toolId)?.destroy();
    this.tools.delete(toolId);
    this.autoEnabledTools.delete(toolId);
    this.alwaysEnabledTools.delete(toolId);
    this.enableAutoEnabledTools();
    return this;
  }

  private enableAutoEnabledTools() {
    if (this.autoEnabledTools.size === 0) {
      return;
    }
    this.autoEnabledTools.forEach(tool => this.enableTool(tool));
  }

}
