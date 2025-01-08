import { Map as OlMap } from 'ol';
import { ToolModel, ToolConfigModel, ToolManagerModel, Selection3dModel } from '../models';
import { ToolTypeHelper } from '../helpers/tool-type.helper';
import { OpenLayersMapClickTool } from './tools/open-layers-map-click-tool';
import { NgZone } from '@angular/core';
import { OpenLayersDrawingTool } from './tools/open-layers-drawing-tool';
import { OpenLayersMousePositionTool } from './tools/open-layers-mouse-position-tool';
import { OpenLayersScaleBarTool } from './tools/open-layers-scale-bar-tool';
import { OpenLayersSelectTool } from './tools/open-layers-select-tool';
import { OpenLayersModifyTool } from "./tools/open-layers-modify-tool";
import { BehaviorSubject, Observable } from 'rxjs';
import { CesiumLayerManager } from './cesium-map/cesium-layer-manager';
import { CesiumEventManager } from './cesium-map/cesium-event-manager';
import { CesiumFeatureInfoHelper } from './helpers/cesium-feature-info.helper';
import { CssHelper } from '@tailormap-viewer/shared';

export class OpenLayersToolManager implements ToolManagerModel {

  private static toolIdCount = 0;
  private tools: Map<string, ToolModel> = new Map();

  private autoEnabledTools = new Set<string>();
  private alwaysEnabledTools = new Set<string>();

  private switchedTool = false;

  private click3DEventSubject$: BehaviorSubject<Selection3dModel | null> = new BehaviorSubject<Selection3dModel | null>(null);
  private click3DEvent$: Observable<Selection3dModel | null> = this.click3DEventSubject$.asObservable();

  constructor(
    private olMap: OlMap,
    private ngZone: NgZone,
    private map3D$: Observable<CesiumLayerManager | null>,
    private in3D$: Observable<boolean>,
  ) {
    map3D$.subscribe(cesiumLayerManager => {
      cesiumLayerManager?.executeScene3DAction(scene3D => {
        CesiumEventManager.onMap3DClick$(scene3D, CssHelper.getCssVariableValue('--primary-color').trim()).subscribe(evt => {
          if (evt.featureInfo) {
            const layerId: string | null = cesiumLayerManager.getLayerId(evt.featureInfo?.primitiveIndex);
            if (layerId) {
              this.click3DEventSubject$.next(CesiumFeatureInfoHelper.addLayerIdToSelection3D(evt, layerId));
            } else {
              this.click3DEventSubject$.next(evt);
            }
          } else {
            this.click3DEventSubject$.next(evt);
          }
        });
      });
    });
  }

  public destroy() {
    const toolIds = Array.from(this.tools.keys());
    this.autoEnabledTools = new Set();
    this.alwaysEnabledTools = new Set();
    toolIds.forEach(id => this.removeTool(id));
  }

  public addTool<T extends ToolModel, C extends ToolConfigModel>(tool: C): T {
    const toolId = `${tool.type.toLowerCase()}-${++OpenLayersToolManager.toolIdCount}`;
    if (ToolTypeHelper.isMapClickTool(tool)) {
      this.tools.set(toolId, new OpenLayersMapClickTool(toolId, tool, this.click3DEvent$, this.in3D$));
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
    return this;
  }

  public enableTool(
    toolId: string,
    disableOtherTools?: boolean,
    enableArgs?: any,
  ): ToolManagerModel {
    if (disableOtherTools) {
      this.disableAllTools();
    }
    const tool = this.tools.get(toolId);
    if (tool && !tool.isActive) {
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
  }

  private enableAutoEnabledTools() {
    if (this.autoEnabledTools.size === 0) {
      return;
    }
    this.autoEnabledTools.forEach(tool => this.enableTool(tool));
  }

  public getClick3DEvent$(): Observable<Selection3dModel | null> {
    return this.click3DEvent$;
  }

}
