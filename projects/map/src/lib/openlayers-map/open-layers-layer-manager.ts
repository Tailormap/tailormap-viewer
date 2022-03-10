import { default as OlMap } from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import VectorImageLayer from 'ol/layer/VectorImage';
import ImageWMS from 'ol/source/ImageWMS';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import { LayerManagerModel, LayerTypes } from '../models';
import { OlLayerHelper } from '../helpers/ol-layer.helper';
import { LayerModel } from '../models/layer.model';
import {
  isOpenLayersTMSLayer,
  isOpenLayersVectorImageLayer,
  isOpenLayersVectorLayer,
  isOpenLayersWMSLayer, isPossibleRealtimeLayer,
} from '../helpers/ol-layer-types.helper';
import { LayerTypesHelper } from '../helpers/layer-types.helper';
import Geometry from 'ol/geom/Geometry';

export class OpenLayersLayerManager implements LayerManagerModel {

  private layers: Map<string, BaseLayer> = new Map<string, BaseLayer>();
  private sources: Map<string, VectorSource<Geometry>> = new Map<string, VectorSource<Geometry>>();

  private backgroundLayerGroup = new LayerGroup();
  private baseLayerGroup = new LayerGroup();
  private drawingLayerGroup = new LayerGroup();

  constructor(private olMap: OlMap) {}

  public init() {
    this.olMap.addLayer(this.backgroundLayerGroup);
    this.olMap.addLayer(this.baseLayerGroup);
    this.olMap.addLayer(this.drawingLayerGroup);
  }

  public destroy() {
    this.layers = new Map();
    this.sources = new Map();
    this.olMap.removeLayer(this.backgroundLayerGroup);
    this.olMap.removeLayer(this.baseLayerGroup);
    this.olMap.removeLayer(this.drawingLayerGroup);
  }

  public setBackgroundLayer(layer: LayerModel) {
    const olLayer = this.createLayer(layer);
    if (olLayer === null) {
      return;
    }
    OlLayerHelper.setLayerProps(layer, olLayer);
    this.backgroundLayerGroup.getLayers().forEach(l => {
      const layerId = l.getProperties()['id'];
      if (this.layers.has(layerId)) {
        this.layers.delete(layerId);
      }
    });
    this.backgroundLayerGroup.getLayers().clear();
    this.layers.set(layer.id, olLayer);
    this.backgroundLayerGroup.getLayers().push(olLayer);
  }

  public setLayers(layers: LayerModel[]) {
    const layerIds = new Set(layers.map(layer => layer.id));
    const removableLayers: string[] = [];
    this.layers.forEach((layer, id) => {
      if (!layerIds.has(id)) {
        removableLayers.push(id);
      }
    });
    removableLayers.forEach(id => this.removeLayer(id));
    layers
      .filter(layer => !this.layers.has(layer.id))
      .forEach(layer => {
        this.addLayer(layer);
      });
    this.setLayerOrder(Array.from(layerIds));
  }

  public addLayer(layer: LayerModel): LayerTypes {
    const olLayer = this.createLayer(layer);
    if (olLayer === null) {
      return null;
    }
    const zIndex = this.getMaxZIndex();
    olLayer.setZIndex(zIndex);
    OlLayerHelper.setLayerProps(layer, olLayer);
    this.layers.set(layer.id, olLayer);
    this.addLayerToMap(olLayer, layer);
    return olLayer;
  }

  public removeLayer(id: string) {
    this.removeLayerAndSource(id);
  }

  public removeLayers(layerIds: string[]) {
    layerIds.forEach(l => this.removeLayerAndSource(l));
  }

  public addLayers(layers: LayerModel[]) {
    layers.forEach(layer => this.addLayer(layer));
  }

  public setLayerVisibility(layerId: string, visible: boolean) {
    const layer = this.findLayer(layerId);
    if (layer) {
      layer.setVisible(visible);
    }
  }

  public setLayerOpacity(layerId: string, opacity: number) {
    const layer = this.findLayer(layerId);
    if (layer) {
      layer.setOpacity(opacity / 100);
    }
  }

  public setLayerOrder(layerIds: string[]) {
    layerIds.reverse();
    let zIndex = 1;
    for (const layerId of layerIds) {
      const layer = this.findLayer(layerId);
      if (layer) {
        layer.setZIndex(zIndex++);
      }
    }
  }

  public refreshLayer(layerId: string) {
    const layer = this.layers.get(layerId);
    if (!layer || !isPossibleRealtimeLayer(layer)) {
      return;
    }
    const source = layer.getSource();
    if (source instanceof ImageWMS) {
      source.updateParams({CACHE: Date.now()});
    }
    if (source instanceof WMTS || source instanceof XYZ) {
      const urls = (source.getUrls() || []).map(url => {
        const u = new URL(url);
        u.searchParams.set('CACHE', `${Date.now()}`);
        return u.toString();
      });
      source.setUrls(urls);
    }
  }

  public findLayer(layerId: string): BaseLayer | null {
    return this.layers.get(layerId) || null;
  }

  private getMaxZIndex() {
    let maxZIndex = 0;
    this.backgroundLayerGroup.getLayers().forEach(layer => {
      maxZIndex = Math.max(maxZIndex, layer.getZIndex() || 0);
    });
    this.baseLayerGroup.getLayers().forEach(layer => {
      maxZIndex = Math.max(maxZIndex, layer.getZIndex() || 0);
    });
    this.drawingLayerGroup.getLayers().forEach(layer => {
      maxZIndex = Math.max(maxZIndex, layer.getZIndex() || 0);
    });
    return maxZIndex;
  }

  private addLayerToMap(layer: BaseLayer, layerModel: LayerModel) {
    if (isOpenLayersWMSLayer(layer) || isOpenLayersTMSLayer(layer)) {
      const layers = this.baseLayerGroup.getLayers();
      layers.push(layer);
      this.baseLayerGroup.setLayers(layers);
      this.layers.set(layerModel.id, layer);
    }
    if (isOpenLayersVectorLayer(layer) || isOpenLayersVectorImageLayer(layer)) {
      const layers = this.drawingLayerGroup.getLayers();
      layers.push(layer);
      this.drawingLayerGroup.setLayers(layers);
    }
  }

  private removeLayerAndSource(layerId: string) {
    const layer = this.findLayer(layerId);
    const source = this.sources.get(layerId);
    if (!layer) {
      return;
    }
    if (source) {
      source.clear();
    }
    this.removeLayerFromMap(layer, layerId);
  }

  private removeLayerFromMap(layer: BaseLayer, layerId?: string) {
    if (layerId) {
      this.removeLayerFromCache(layer, layerId);
    }
    if (isOpenLayersWMSLayer(layer) || isOpenLayersTMSLayer(layer)) {
      const layers = this.baseLayerGroup.getLayers();
      layers.remove(layer);
      this.baseLayerGroup.setLayers(layers);
    }
    if (isOpenLayersVectorLayer(layer) || isOpenLayersVectorImageLayer(layer)) {
      const layers = this.drawingLayerGroup.getLayers();
      layers.remove(layer);
      this.drawingLayerGroup.setLayers(layers);
    }
  }

  private removeLayerFromCache(layer: BaseLayer, layerId: string) {
    this.layers.delete(layerId);
    if (isOpenLayersWMSLayer(layer) || isOpenLayersTMSLayer(layer)) {
      this.layers.delete(layerId);
    }
    if (isOpenLayersVectorLayer(layer) || isOpenLayersVectorImageLayer(layer)) {
      this.layers.delete(layerId);
      this.sources.delete(layerId);
    }
  }

  private createLayer(layer: LayerModel): LayerTypes {
    if (LayerTypesHelper.isVectorLayer(layer)) {
      return this.createVectorLayer(layer);
    }
    const olLayer = OlLayerHelper.createLayer(layer, this.olMap.getView().getProjection());
    if (!olLayer) {
      return null;
    }
    if (typeof layer.transparency === 'number') {
      olLayer.setOpacity(layer.transparency / 100);
    }
    return olLayer;
  }

  private createVectorLayer(layer: LayerModel): VectorImageLayer<VectorSource<Geometry>> | null {
    const source = new VectorSource({ wrapX: true });
    this.sources.set(layer.id, source);
    return OlLayerHelper.createVectorLayer(layer, source);
  }

}
