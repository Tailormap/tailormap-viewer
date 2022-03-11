import { Injectable, NgZone } from '@angular/core';
import { OpenLayersMap } from '../openlayers-map/openlayers-map';
import { finalize, map, Observable, tap } from 'rxjs';
import { LayerManagerModel, MapResolutionModel, MapViewerOptionsModel, ToolModel } from '../models';
import { ToolManagerModel } from '../models/tool-manager.model';
import Projection from 'ol/proj/Projection';

@Injectable({
  providedIn: 'root',
})
export class MapService {

  private readonly map: OpenLayersMap;

  constructor(
    private ngZone: NgZone,
  ) {
    this.map = new OpenLayersMap(this.ngZone);
  }

  public initMap(options: MapViewerOptionsModel) {
    this.map.initMap(options);
  }

  public render(el: HTMLElement) {
    this.map.render(el);
  }

  public getLayerManager$(): Observable<LayerManagerModel> {
    return this.map.getLayerManager$();
  }

  public getToolManager$(): Observable<ToolManagerModel> {
    return this.map.getToolManager$();
  }

  public createTool$(tool: ToolModel, enable?: boolean): Observable<[ ToolManagerModel, string ]> {
    let toolManager: ToolManagerModel;
    let toolId: string;
    return this.getToolManager$()
      .pipe(
        tap(manager => toolManager = manager),
        finalize(() => {
          if (!!toolId && !!toolManager) {
            toolManager.removeTool(toolId);
          }
        }),
        map(manager => {
          const id = manager.addTool(tool);
          if (enable) {
            manager.enableTool(id);
          }
          return [ manager, id ];
        }),
      );
  }

  public getPixelForCoordinates$(coordinates: [ number, number ]): Observable<[ number, number ] | null> {
    return this.map.getPixelForCoordinates$(coordinates);
  }

  public getResolution$(): Observable<MapResolutionModel> {
    return this.map.getResolution$();
  }

  public getProjectionCode$(): Observable<string> {
    return this.map.getProjection$().pipe(map(p => p.getCode()));
  }

  public zoomIn() {
    this.map.zoomIn();
  }

  public zoomOut() {
    this.map.zoomOut();
  }

}
