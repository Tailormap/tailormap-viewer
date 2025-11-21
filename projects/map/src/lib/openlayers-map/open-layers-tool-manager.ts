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
import { ToolsStatusModel } from '../models/tools-status.model';

const TOOL_STATUS_DEBOUNCE_TIME = 10;

export class OpenLayersToolManager implements ToolManagerModel {

  private static toolIdCount = 0;
  private tools: Map<string, { tool: ToolModel; owner: string }> = new Map();

  private autoEnabledTools = new Set<string>();
  private alwaysEnabledTools = new Set<string>();

  private switchedTool = false;

  private toolsStatusChanged = new Subject();
  private toolsStatusChanged$ = this.toolsStatusChanged.asObservable()
    .pipe(
      debounceTime(TOOL_STATUS_DEBOUNCE_TIME),
      map(() => ({
        disabledTools: Array.from(this.tools.values())
          .filter(t => !t.tool.isActive)
          .map(t => ({ toolId: t.tool.id, owner: t.owner })),
        enabledTools: Array.from(this.tools.values())
          .filter(t => t.tool.isActive)
          .map(t => ({ toolId: t.tool.id, owner: t.owner })),
      })));

  private debugLogging = true;

  constructor(
    private olMap: OlMap,
    private ngZone: NgZone,
  ) {
    if (this.debugLogging) {
      this.getToolStatusChanged$().subscribe(() => {
        console.log('[OpenLayersToolManager] Tools status changed');
        const toolStatus: Array<{ id: string; owner: string; active: boolean }> = [];
        this.tools.forEach(tool => {
          toolStatus.push({ id: tool.tool.id, owner: tool.owner, active: tool.tool.isActive });
        });
        toolStatus.sort((a, b) => {
          if (a.active === b.active) {
            return 0;
          }
          return a.active ? -1 : 1;
        });
        console.table(toolStatus);
      });
    }
  }

  public destroy() {
    const toolIds = Array.from(this.tools.keys());
    this.autoEnabledTools = new Set();
    this.alwaysEnabledTools = new Set();
    toolIds.forEach(id => this.removeTool(id));
    this.toolsStatusChanged.complete();
  }

  public addTool<T extends ToolModel, C extends ToolConfigModel>(tool: C): T {
    const toolId = `${tool.type.toLowerCase()}-${++OpenLayersToolManager.toolIdCount}`;
    if (ToolTypeHelper.isMapClickTool(tool)) {
      this.tools.set(toolId, { tool: new OpenLayersMapClickTool(toolId, tool), owner: tool.owner });
    }
    if (ToolTypeHelper.isDrawingTool(tool)) {
      this.tools.set(toolId, { tool: new OpenLayersDrawingTool(toolId, tool, this.olMap, this.ngZone), owner: tool.owner });
    }
    if (ToolTypeHelper.isMousePositionTool(tool)) {
      this.tools.set(toolId, { tool: new OpenLayersMousePositionTool(toolId, tool, this.olMap, this.ngZone), owner: tool.owner });
    }
    if (ToolTypeHelper.isScaleBarTool(tool)) {
      this.tools.set(toolId, { tool: new OpenLayersScaleBarTool(toolId, tool, this.olMap), owner: tool.owner });
    }
    if (ToolTypeHelper.isSelectTool(tool)) {
      this.tools.set(toolId, { tool: new OpenLayersSelectTool(toolId, tool, this.olMap, this.ngZone), owner: tool.owner });
    }
    if (ToolTypeHelper.isModifyTool(tool)) {
      this.tools.set(toolId, { tool: new OpenLayersModifyTool(toolId, tool, this.olMap, this.ngZone), owner: tool.owner });
    }
    if (ToolTypeHelper.isExtTransformTool(tool)) {
      this.tools.set(toolId, { tool: new OpenLayersExtTransformTool(toolId, tool, this.olMap, this.ngZone), owner: tool.owner });
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
    return tool.tool as T;
  }

  public disableTool(toolId?: string, preventAutoEnableTools?: boolean): ToolManagerModel {
    if (!toolId) {
      return this;
    }
    if (this.debugLogging) {
      console.log(`[OpenLayersToolManager] Disabling tool ${toolId} (owner=${this.tools.get(toolId)?.owner}, preventAutoEnableTools=${preventAutoEnableTools})`);
    }
    if (!preventAutoEnableTools) {
      this.enableAutoEnabledTools();
    }
    if (!this.tools.get(toolId)?.tool.isActive) {
     return this;
    }
    this.tools.get(toolId)?.tool.disable();
    this.toolsStatusChanged.next(null);
    return this;
  }

  public getToolStatusChanged$(): Observable<ToolsStatusModel> {
    return this.toolsStatusChanged$;
  }

  public enableTool(
    toolId?: string,
    disableOtherTools?: boolean,
    enableArgs?: any,
    forceEnableIfActivated?: boolean,
  ): ToolManagerModel {
    if (!toolId) {
      return this;
    }
    if (this.debugLogging) {
      console.log(`[OpenLayersToolManager] Enabling tool ${toolId} ` +
       `(owner=${this.tools.get(toolId)?.owner}, disableOtherTools=${disableOtherTools}, forceEnableIfActivated=${forceEnableIfActivated})`, enableArgs);
    }
    if (disableOtherTools) {
      this.disableAllTools();
    }
    const tool = this.tools.get(toolId);
    if (tool && (!tool.tool.isActive || forceEnableIfActivated)) {
      tool.tool.enable(enableArgs);
      this.switchedTool = true;
      window.setTimeout(() => this.switchedTool = false, TOOL_STATUS_DEBOUNCE_TIME + 5);
    }
    this.toolsStatusChanged.next(null);
    return this;
  }

  public removeTool(toolId?: string): ToolManagerModel {
    if (!toolId) {
      return this;
    }
    this.tools.get(toolId)?.tool.destroy();
    this.tools.delete(toolId);
    this.autoEnabledTools.delete(toolId);
    this.alwaysEnabledTools.delete(toolId);
    this.enableAutoEnabledTools();
    return this;
  }

  private disableAllTools() {
    this.tools.forEach((tool) => {
      if (tool.tool.isActive && !this.alwaysEnabledTools.has(tool.tool.id)) {
        tool.tool.disable();
      }
    });
    this.toolsStatusChanged.next(null);
  }

  private enableAutoEnabledTools() {
    if (this.debugLogging) {
      console.log('[OpenLayersToolManager] Enabling auto-enabled tools', Array.from(this.autoEnabledTools));
    }
    if (this.switchedTool || this.autoEnabledTools.size === 0) {
      return;
    }
    this.autoEnabledTools.forEach(tool => this.enableTool(tool));
  }
}
