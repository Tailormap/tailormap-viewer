import { default as OlMap } from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import ImageWMS from 'ol/source/ImageWMS';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import { LayerManagerModel, LayerTypes } from '../models';
import { OlLayerHelper } from '../helpers/ol-layer.helper';
import { LayerModel } from '../models/layer.model';
import { isOpenLayersVectorLayer, isPossibleRealtimeLayer } from '../helpers/ol-layer-types.helper';
import { LayerTypesHelper } from '../helpers/layer-types.helper';
import Geometry from 'ol/geom/Geometry';

export class OpenLayersLayerManager implements LayerManagerModel {

  private layers: Map<string, BaseLayer> = new Map<string, BaseLayer>();
  private vectorLayers: Map<string, VectorLayer<VectorSource<Geometry>>> = new Map<string, VectorLayer<VectorSource<Geometry>>>();

  private backgroundLayerGroup = new LayerGroup();
  private baseLayerGroup = new LayerGroup();
  private vectorLayerGroup = new LayerGroup();

  constructor(private olMap: OlMap) {}

  public init() {
    this.olMap.addLayer(this.backgroundLayerGroup);
    this.olMap.addLayer(this.baseLayerGroup);
    this.olMap.addLayer(this.vectorLayerGroup);
  }

  public destroy() {
    this.layers = new Map();
    this.vectorLayers = new Map();
    this.olMap.removeLayer(this.backgroundLayerGroup);
    this.olMap.removeLayer(this.baseLayerGroup);
    this.olMap.removeLayer(this.vectorLayerGroup);
  }

  public setBackgroundLayers(layers: LayerModel[]) {
    this.backgroundLayerGroup.getLayers().forEach(l => {
      const layerId = l.getProperties()['id'];
      if (this.layers.has(layerId)) {
        this.layers.delete(layerId);
      }
    });
    this.backgroundLayerGroup.getLayers().clear();
    layers.forEach(layer => {
      const olLayer = this.createLayer(layer);
      if (olLayer === null) {
        return;
      }
      OlLayerHelper.setLayerProps(layer, olLayer);
      this.layers.set(layer.id, olLayer);
      this.backgroundLayerGroup.getLayers().push(olLayer);
    });
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
    const layerOrder = Array.from(layerIds).reverse();
    layers
      .forEach(layer => {
        const zIndex = layerOrder.indexOf(layer.id);
        const existingLayer = this.layers.get(layer.id);
        if (existingLayer) {
          existingLayer.setZIndex(this.getZIndexForLayer(zIndex));
          return;
        }
        this.addLayer(layer, zIndex);
      });
  }

  public addLayer<LayerType extends LayerTypes>(layer: LayerModel, zIndex?: number): LayerType | null {
    const olLayer = this.createLayer(layer);
    if (olLayer === null) {
      return null;
    }
    OlLayerHelper.setLayerProps(layer, olLayer);
    this.addLayerToMap(olLayer);
    olLayer.setZIndex(this.getZIndexForLayer(zIndex));
    this.moveDrawingLayersToTop();
    return olLayer as LayerType;
  }

  private getZIndexForLayer(zIndex?: number) {
    if (typeof zIndex === 'undefined' || zIndex === -1) {
      zIndex = this.getMaxZIndex();
    }
    zIndex += this.backgroundLayerGroup.getLayers().getLength();
    return zIndex;
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
    let zIndex = 1;
    for (const layerId of layerIds) {
      const layer = this.findLayer(layerId);
      if (layer) {
        layer.setZIndex(zIndex++);
      }
    }
  }

  private moveDrawingLayersToTop() {
    let zIndex = this.backgroundLayerGroup.getLayers().getLength() + this.baseLayerGroup.getLayers().getLength();
    this.vectorLayerGroup.getLayers().forEach(layer => {
      layer.setZIndex(++zIndex);
    });
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
    return this.layers.get(layerId) || this.vectorLayers.get(layerId) || null;
  }

  private getMaxZIndex() {
    let maxZIndex = 0;
    this.baseLayerGroup.getLayers().forEach(layer => {
      maxZIndex = Math.max(maxZIndex, layer.getZIndex() || 0);
    });
    return maxZIndex;
  }

  private addLayerToMap(layer: BaseLayer) {
    if (isOpenLayersVectorLayer(layer)) {
      const vectorLayers = this.vectorLayerGroup.getLayers();
      vectorLayers.push(layer);
      this.vectorLayerGroup.setLayers(vectorLayers);
      return;
    }
    const layers = this.baseLayerGroup.getLayers();
    layers.push(layer);
    this.baseLayerGroup.setLayers(layers);
  }

  private removeLayerAndSource(layerId: string) {
    const layer = this.findLayer(layerId);
    if (!layer) {
      return;
    }
    if (isOpenLayersVectorLayer(layer)) {
      this.removeVectorLayer(layer, layerId);
      return;
    }
    const layers = this.baseLayerGroup.getLayers();
    layers.remove(layer);
    this.baseLayerGroup.setLayers(layers);
    this.layers.delete(layerId);
  }

  private removeVectorLayer(layer: VectorLayer<VectorSource<Geometry>>, layerId: string) {
    const vectorLayer = this.vectorLayers.get(layerId);
    if (vectorLayer) {
      vectorLayer.getSource().clear();
    }
    const vectorLayers = this.vectorLayerGroup.getLayers();
    vectorLayers.remove(layer);
    this.vectorLayerGroup.setLayers(vectorLayers);
    this.vectorLayers.delete(layerId);
    return;
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
    this.layers.set(layer.id, olLayer);
    return olLayer;
  }

  private createVectorLayer(layer: LayerModel): VectorLayer<VectorSource<Geometry>> | null {
    const source = new VectorSource({ wrapX: true });
    const vectorLayer = new VectorLayer({ source, visible: layer.visible });
    this.vectorLayers.set(layer.id, vectorLayer);
    return vectorLayer;
  }

}
