import { Map as OlMap } from 'ol';
import { ToolModel, ToolConfigModel, ToolManagerModel } from '../models';
import { ToolTypeHelper } from '../helpers/tool-type.helper';
import { OpenLayersMapClickTool } from './tools/open-layers-map-click-tool';
import { NgZone } from '@angular/core';
import { OpenLayersDrawingTool } from './tools/open-layers-drawing-tool';
import { OpenLayersMousePositionTool } from './tools/open-layers-mouse-position-tool';
import { OpenLayersScaleBarTool } from './tools/open-layers-scale-bar-tool';
import { OpenLayersSelectTool } from './tools/open-layers-select-tool';
import { OpenLayersModifyTool } from "./tools/open-layers-modify-tool";
import { map, Observable, Subject } from 'rxjs';
import { OpenLayersExtTransformTool } from './tools/open-layers-ext-transform-tool';
import { debounceTime } from 'rxjs/operators';

export class OpenLayersToolManager implements ToolManagerModel {

  private static toolIdCount = 0;
  private tools: Map<string, ToolModel> = new Map();

  private autoEnabledTools = new Set<string>();
  private alwaysEnabledTools = new Set<string>();

  private switchedTool = false;

  public toolsDisabled = new Subject();

  constructor(
    private olMap: OlMap,
    private ngZone: NgZone,
  ) {
  }

  public destroy() {
    const toolIds = Array.from(this.tools.keys());
    this.autoEnabledTools = new Set();
    this.alwaysEnabledTools = new Set();
    toolIds.forEach(id => this.removeTool(id));
    this.toolsDisabled.complete();
  }

  public addTool<T extends ToolModel, C extends ToolConfigModel>(tool: C): T {
    const toolId = `${tool.type.toLowerCase()}-${++OpenLayersToolManager.toolIdCount}`;
    if (ToolTypeHelper.isMapClickTool(tool)) {
      this.tools.set(toolId, new OpenLayersMapClickTool(toolId, tool));
    }
    if (ToolTypeHelper.isDrawingTool(tool)) {
      this.tools.set(toolId, new OpenLayersDrawingTool(toolId, tool, this.olMap, this.ngZone));
    }
    if (ToolTypeHelper.isMousePositionTool(tool)) {
      this.tools.set(toolId, new OpenLayersMousePositionTool(toolId, tool, this.olMap, this.ngZone));
    }
    if (ToolTypeHelper.isScaleBarTool(tool)) {
      this.tools.set(toolId, new OpenLayersScaleBarTool(toolId, tool, this.olMap));
    }
    if (ToolTypeHelper.isSelectTool(tool)) {
      this.tools.set(toolId, new OpenLayersSelectTool(toolId, tool, this.olMap, this.ngZone));
    }
    if (ToolTypeHelper.isModifyTool(tool)) {
      this.tools.set(toolId, new OpenLayersModifyTool(toolId, tool, this.olMap, this.ngZone));
    }
    if (ToolTypeHelper.isExtTransformTool(tool)) {
      this.tools.set(toolId, new OpenLayersExtTransformTool(toolId, tool, this.olMap, this.ngZone));
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
    const createdTool = this.getTool<T>(toolId);
    if (!createdTool) {
      throw new Error('Created a tool that does not exist. Please check the source code for tool ' + tool.type);
    }
    return createdTool;
  }

  public getTool<T extends ToolModel>(toolId: string): T | null {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return null;
    }
    return tool as T;
  }

  public disableTool(toolId: string, preventAutoEnableTools?: boolean): ToolManagerModel {
    this.tools.get(toolId)?.disable();
    if (!preventAutoEnableTools && !this.switchedTool) {
      this.enableAutoEnabledTools();
    }
    this.toolsDisabled.next(null);
    return this;
  }

  public getToolsDisabled$(): Observable<{ disabledTools: string[]; enabledTools: string[] }> {
    return this.toolsDisabled.asObservable()
      .pipe(
        debounceTime(10),
        map(() => ({
        disabledTools: Array.from(this.tools.values()).filter(t => !t.isActive).map(t => t.id),
        enabledTools: Array.from(this.tools.values()).filter(t => t.isActive).map(t => t.id),
      })));
  }

  public enableTool(
    toolId: string,
    disableOtherTools?: boolean,
    enableArgs?: any,
    forceEnableIfActivated?: boolean,
  ): ToolManagerModel {
    if (disableOtherTools) {
      this.disableAllTools();
    }
    const tool = this.tools.get(toolId);
    if (tool && (!tool.isActive || forceEnableIfActivated)) {
      tool.enable(enableArgs);
      this.switchedTool = true;
      window.setTimeout(() => this.switchedTool = false, 0);
    }
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

  private disableAllTools() {
    this.tools.forEach((tool) => {
      if (tool.isActive && !this.alwaysEnabledTools.has(tool.id)) {
        tool.disable();
      }
    });
    this.toolsDisabled.next(null);
  }

  private enableAutoEnabledTools() {
    if (this.autoEnabledTools.size === 0) {
      return;
    }
    this.autoEnabledTools.forEach(tool => this.enableTool(tool));
  }
}
