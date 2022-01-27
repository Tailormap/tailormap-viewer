import { default as OlMap } from 'ol/Map';
import { ToolManagerModel } from '../models/tool-manager.model';
import { ToolModel } from '../models/tools/tool.model';
import { ToolTypeHelper } from '../helpers/tool-type.helper';
import { OpenLayersTool } from './tools/open-layers-tool';
import { OpenLayersMapClickTool } from './tools/open-layers-map-click-tool';
import { NgZone } from "@angular/core";

export class OpenLayersToolManager implements ToolManagerModel {

  private static toolIdCount = 0;
  private tools: Map<string, OpenLayersTool> = new Map();
  private previouslyActiveTools: string[] = [];

    constructor(private olMap: OlMap, private ngZone: NgZone) {}

  public destroy() {
    const toolIds = Array.from(this.tools.keys());
    this.previouslyActiveTools = [];
    toolIds.forEach(id => this.removeTool(id));
  }

  public addTool(tool: ToolModel): string {
    const toolId = `${tool.type.toLowerCase()}-${++OpenLayersToolManager.toolIdCount}`;
    if (ToolTypeHelper.isMapClickTool(tool)) {
      this.tools.set(toolId, new OpenLayersMapClickTool(this.olMap, this.ngZone, tool));
    }
    return toolId;
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
