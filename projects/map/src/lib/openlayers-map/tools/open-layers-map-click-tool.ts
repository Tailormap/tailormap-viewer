import { OpenLayersTool } from './open-layers-tool';
import { MapClickToolModel } from '../../models';
import { default as OlMap } from 'ol/Map';
import { MapBrowserEvent } from 'ol';

export class OpenLayersMapClickTool implements OpenLayersTool {

  private clickHandler = this.handleClick.bind(this);

  constructor(
    private map: OlMap,
    private toolConfig: MapClickToolModel,
  ) {
  }

  public isActive = false;

  public destroy(): void {
    this.map.un('singleclick', this.clickHandler);
  }

  public disable(): void {
    this.map.un('singleclick', this.clickHandler);
  }

  public enable(): void {
    this.map.on('singleclick', this.clickHandler);
  }

  private handleClick(evt: MapBrowserEvent<MouseEvent>) {
    this.toolConfig.onClick({
      mapCoordinates: [evt.coordinate[0], evt.coordinate[1]],
      mouseCoordinates: [evt.pixel[0], evt.pixel[1]],
    });
  }

}
