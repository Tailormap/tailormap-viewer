import { Map as OlMap } from 'ol';
import { Layer } from 'ol/layer.js';
import { EventsKey } from 'ol/events.js';
import { unByKey } from 'ol/Observable.js';
import { default as RenderEvent } from 'ol/render/Event.js';
import { getRenderPixel } from 'ol/render.js';
import { LayerSwipeModel } from '../models';

export class OpenLayersLayerSwipe {

  private olMap: OlMap | null = null;
  private precomposeKey: EventsKey | null = null;
  private clippedLayers = new Map<Layer, EventsKey[]>();
  private swipe: LayerSwipeModel | null = null;

  public init(olMap: OlMap) {
    this.destroy();
    this.olMap = olMap;
    this.precomposeKey = olMap.on('precompose', () => this.updateClippedLayers());
    olMap.render();
  }

  public destroy() {
    if (this.precomposeKey) {
      unByKey(this.precomposeKey);
      this.precomposeKey = null;
    }
    this.clippedLayers.forEach(keys => unByKey(keys));
    this.clippedLayers.clear();
    this.olMap = null;
  }

  public setSwipe(swipe: LayerSwipeModel | null) {
    this.swipe = swipe;
    this.olMap?.render();
  }

  private updateClippedLayers() {
    const layerIds = new Set(this.swipe?.layerIds ?? []);
    const layers = new Set((this.olMap?.getAllLayers() ?? [])
      .filter(layer => layerIds.has(layer.get('id'))));
    this.clippedLayers.forEach((keys, layer) => {
      if (!layers.has(layer)) {
        unByKey(keys);
        this.clippedLayers.delete(layer);
      }
    });
    layers.forEach(layer => {
      if (!this.clippedLayers.has(layer)) {
        this.clippedLayers.set(layer, [
          layer.on('prerender', event => this.clip(event)),
          layer.on('postrender', event => OpenLayersLayerSwipe.getCanvasContext(event)?.restore()),
        ]);
      }
    });
  }

  private clip(event: RenderEvent) {
    const context = OpenLayersLayerSwipe.getCanvasContext(event);
    const size = event.frameState?.size;
    if (!context || !size) {
      return;
    }
    // Always save, even without anything to clip, to stay balanced with the restore on postrender.
    context.save();
    if (!this.swipe) {
      return;
    }
    const [ width, height ] = size;
    const x = width * Math.min(1, Math.max(0, this.swipe.position));
    // getRenderPixel accounts for the device pixel ratio and map rotation.
    const corners = [[ 0, 0 ], [ x, 0 ], [ x, height ], [ 0, height ]].map(pixel => getRenderPixel(event, pixel));
    context.beginPath();
    corners.forEach(([ px, py ], idx) => idx === 0 ? context.moveTo(px, py) : context.lineTo(px, py));
    context.closePath();
    context.clip();
  }

  private static getCanvasContext(event: RenderEvent): CanvasRenderingContext2D | null {
    return event.context instanceof CanvasRenderingContext2D ? event.context : null;
  }

}
