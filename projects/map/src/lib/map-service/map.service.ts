import { Injectable, NgZone } from '@angular/core';
import { OpenLayersMap } from '../openlayers-map/openlayers-map';
import { ExtentHelper } from '../helpers/extent.helper';

@Injectable({
  providedIn: 'root',
})
export class MapService {

  private readonly map: OpenLayersMap;

  constructor(
    private ngZone: NgZone,
  ) {
    this.map = new OpenLayersMap({
      projection: 'EPSG:28992',
      maxExtent: ExtentHelper.getRdExtent(),
      initialExtent: [5000, 304000, 284000, 625000],
    }, this.ngZone);
  }

  public render(el: HTMLElement) {
    this.map.render(el);
  }

  public getLayerManager() {
    return this.map.getLayerManager();
  }

}
