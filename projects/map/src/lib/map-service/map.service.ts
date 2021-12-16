import { Injectable, NgZone } from '@angular/core';
import { OpenLayersMap } from '../openlayers-map/openlayers-map';
import { Observable } from 'rxjs';
import { LayerManagerModel } from '../models/layer-manager.model';
import { MapViewerOptionsModel } from '../models/map-viewer-options.model';

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

  public setProjection(options: MapViewerOptionsModel) {
    this.map.setProjection(options);
  }

  public render(el: HTMLElement) {
    this.map.render(el);
  }

  public getLayerManager(): Observable<LayerManagerModel> {
    return this.map.getLayerManager$();
  }

}
