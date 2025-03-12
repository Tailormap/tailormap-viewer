import { Map as OlMap } from 'ol';
import { Group as LayerGroup, Layer as BaseLayer, Vector as VectorLayer } from 'ol/layer';
import { ImageWMS, TileWMS, Vector as VectorSource, WMTS, XYZ } from 'ol/source';
import { get as getProjection, Projection } from 'ol/proj';
import { LayerManagerModel, LayerTypes } from '../models';
import { OlLayerHelper } from '../helpers/ol-layer.helper';
import { LayerModel } from '../models/layer.model';
import { VectorLayerModel } from '../models/vector-layer.model';
import { isOpenLayersVectorLayer, isOpenLayersWMSLayer, isPossibleRealtimeLayer } from '../helpers/ol-layer-types.helper';
import { LayerTypesHelper } from '../helpers/layer-types.helper';
import { ArrayHelper } from '@tailormap-viewer/shared';
import { NgZone } from '@angular/core';
import { HttpXsrfTokenExtractor } from '@angular/common/http';
import { ServerType } from '@tailormap-viewer/api';

export class OpenLayersLayerManager implements LayerManagerModel {

  private layers: Map<string, BaseLayer> = new Map<string, BaseLayer>();
  private backgroundLayers: Map<string, BaseLayer> = new Map<string, BaseLayer>();
  private vectorLayers: Map<string, VectorLayer> = new Map<string, VectorLayer>();

  private backgroundLayerGroup = new LayerGroup();
  private baseLayerGroup = new LayerGroup();
  private vectorLayerGroup = new LayerGroup();

  private prevBackgroundLayerIds: string[] = [];
  private prevLayerIdentifiers: string[] = [];

  private currentMapProjection: Projection;

  constructor(private olMap: OlMap, private ngZone: NgZone, private httpXsrfTokenExtractor: HttpXsrfTokenExtractor) {
    this.currentMapProjection = this.olMap.getView().getProjection();
  }

  public init() {
    this.olMap.addLayer(this.backgroundLayerGroup);
    this.olMap.addLayer(this.baseLayerGroup);
    this.olMap.addLayer(this.vectorLayerGroup);
  }

  public destroy() {
    this.layers = new Map();
    this.backgroundLayers = new Map();
    this.vectorLayers = new Map();
    this.olMap.removeLayer(this.backgroundLayerGroup);
    this.olMap.removeLayer(this.baseLayerGroup);
    this.olMap.removeLayer(this.vectorLayerGroup);
  }

  public setBackgroundLayers(layers: LayerModel[], useProjection?: string) {
    this.prevBackgroundLayerIds = this.updateLayers(
      layers,
      this.backgroundLayers,
      this.prevBackgroundLayerIds,
      this.addBackgroundLayer.bind(this),
      this.removeBackgroundLayer.bind(this),
      this.getZIndexForBackgroundLayer.bind(this),
      this.backgroundLayerGroup,
      useProjection,
    );
  }

  private addBackgroundLayer(layer: LayerModel, zIndex?: number, useProjection?: string) {
    const olLayer = this.createLayer(layer, useProjection);
    if (olLayer === null) {
      return;
    }
    OlLayerHelper.setLayerProps(layer, olLayer);
    this.backgroundLayers.set(layer.id, olLayer);
    this.backgroundLayerGroup.getLayers().push(olLayer);
    olLayer.setZIndex(this.getZIndexForBackgroundLayer(zIndex));
  }

  private removeBackgroundLayer(layerId: string) {
    this.removeLayerAndSource(layerId, this.backgroundLayerGroup, this.backgroundLayers);
  }

  private getZIndexForBackgroundLayer(zIndex?: number) {
    if (typeof zIndex === 'undefined' || zIndex === -1) {
      zIndex = this.backgroundLayerGroup.getLayers().getLength();
    }
    return zIndex;
  }

  public setLayers(layers: LayerModel[], useProjection?: string) {
    this.prevLayerIdentifiers = this.updateLayers(
      layers,
      this.layers,
      this.prevLayerIdentifiers,
      this.addLayer.bind(this),
      this.removeLayer.bind(this),
      this.getZIndexForLayer.bind(this),
      this.baseLayerGroup,
      useProjection,
    );
  }

  private updateLayers(
    layers: LayerModel[],
    currentLayerMap: Map<string, BaseLayer>,
    prevLayerIdentifiers: string[],
    addLayer: (layer: LayerModel, zIndex: number, useProjection?: string) => void,
    removeLayer: (id: string) => void,
    getZIndexForLayer: (zIndex?: number) => number,
    layerGroup: LayerGroup,
    useProjection?: string,
  ) {
    const layerIdentifiers = this.createLayerIdentifiers(layers);
    if (useProjection && useProjection !== this.currentMapProjection.getCode()) {
      layerGroup.getLayers().clear();
      currentLayerMap.clear();
      this.currentMapProjection = getProjection(useProjection)!;
    } else if (ArrayHelper.arrayEquals(layerIdentifiers, prevLayerIdentifiers)) {
      return prevLayerIdentifiers;
    }
    if (useProjection && useProjection === 'EPSG:3857') {
      layers = layers.filter(layer => layer.webMercatorAvailable);
    }
    const layerIds = layers.map(layer => layer.id);
    const layerIdSet = new Set(layerIds);
    const removableLayers: string[] = [];
    currentLayerMap.forEach((layer, id) => {
      if (!layerIdSet.has(id)) {
        removableLayers.push(id);
      }
    });
    removableLayers.forEach(id => removeLayer(id));
    const layerOrder = layerIds.reverse();
    layers
      .forEach(layer => {
        const zIndex = layerOrder.indexOf(layer.id);
        const existingLayer = currentLayerMap.get(layer.id);
        if (existingLayer) {
          this.updatePropertiesIfChanged(layer, existingLayer);
          this.updateFilterIfChanged(layer, existingLayer);
          existingLayer.setZIndex(getZIndexForLayer(zIndex));
          return;
        }
        addLayer(layer, zIndex, useProjection);
      });
    return layerIdentifiers;
  }

  public addLayer<LayerType extends LayerTypes>(layer: LayerModel, zIndex?: number, useProjection?: string): LayerType | null {
    const olLayer = this.createLayer(layer, useProjection);
    if (olLayer === null) {
      return null;
    }
    OlLayerHelper.setLayerProps(layer, olLayer);
    this.addLayerToMap(olLayer);
    olLayer.setZIndex(this.getZIndexForLayer(zIndex));
    this.moveDrawingLayersToTop();
    if (!LayerTypesHelper.isVectorLayer(layer)) {
      this.layers.set(layer.id, olLayer);
    }
    return olLayer as LayerType;
  }

  private getZIndexForLayer(zIndex?: number) {
    if (typeof zIndex === 'undefined' || zIndex === -1) {
      zIndex = this.getMaxZIndex();
    }
    zIndex += this.backgroundLayerGroup.getLayers().getLength();
    return zIndex;
  }

  // Create an identifier for each layer to quickly check if something changed and requires re-rendering
  private createLayerIdentifiers(layers: LayerModel[]): string[] {
    return layers.map(layer => {
      const changingProps = [layer.opacity ? `${layer.opacity}` : undefined];
      if (LayerTypesHelper.isServiceLayer(layer)) {
        changingProps.push(layer.filter);
      }
      return [ layer.id, ...changingProps.filter(Boolean) ].join('_');
    });
  }

  private updatePropertiesIfChanged(layer: LayerModel, olLayer: BaseLayer) {
    const currentOpacity = olLayer.getOpacity();
    const layerOpacity = typeof layer.opacity === 'undefined' ? 1 : layer.opacity / 100;
    if (currentOpacity !== layerOpacity) {
      olLayer.setOpacity(layerOpacity);
    }
  }

  private updateFilterIfChanged(layer: LayerModel, olLayer: BaseLayer) {
    // For now, GeoServer & WMS only
    if (!LayerTypesHelper.isWmsLayer(layer) || layer.serverType !== ServerType.GEOSERVER) {
      return;
    }
    const existingProps = OlLayerHelper.getLayerProps(olLayer);
    if (existingProps.filter === layer.filter) {
      return;
    }
    OlLayerHelper.setLayerProps(layer, olLayer);
    if (isOpenLayersWMSLayer(olLayer)) {
      olLayer.getSource()?.updateParams({ CQL_FILTER: layer.filter });
    }
  }

  public removeLayer(id: string) {
    this.removeLayerAndSource(id, this.baseLayerGroup, this.layers);
  }

  public removeLayers(layerIds: string[]) {
    layerIds.forEach(l => this.removeLayerAndSource(l, this.baseLayerGroup, this.layers));
  }

  public getLayer(layerId: string) {
    const layer = this.layers.get(layerId) || this.vectorLayers.get(layerId);
    if (!layer) {
      return;
    }
    return layer;
  }

  public addLayers(layers: LayerModel[]) {
    layers.forEach(layer => this.addLayer(layer));
  }

  public setLayerVisibility(layerId: string, visible: boolean) {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.setVisible(visible);
    }
  }

  public setLayerOpacity(layerId: string, opacity: number) {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.setOpacity(opacity / 100);
    }
  }

  public setLayerOrder(layerIds: string[]) {
    let zIndex = 1;
    for (const layerId of layerIds) {
      const layer = this.layers.get(layerId);
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
    if (source instanceof ImageWMS || source instanceof TileWMS) {
      source.updateParams({ CACHE: Date.now() });
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

  public getLegendUrl(layerId: string): string {
    const layer = this.layers.get(layerId);
    if (!layer) {
      return '';
    }
    if (isOpenLayersWMSLayer(layer)) {
      return layer.getSource()?.getLegendUrl(
        undefined, {
          // Use WMS version 1.1.0 for higher GetLegendGraphic compatibility
          VERSION: '1.1.0',
          SLD_VERSION: '1.1.0',
        },
      ) || '';
    }
    return '';
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

  private removeLayerAndSource(
    layerId: string,
    layerGroup: LayerGroup,
    layerMap: Map<string, BaseLayer>,
  ) {
    const layer = layerMap.get(layerId) || this.vectorLayers.get(layerId);
    if (!layer) {
      return;
    }
    if (isOpenLayersVectorLayer(layer)) {
      this.removeVectorLayer(layer, layerId);
      return;
    }
    const layers = layerGroup.getLayers();
    layers.remove(layer);
    layerGroup.setLayers(layers);
    layerMap.delete(layerId);
  }

  private removeVectorLayer(layer: VectorLayer, layerId: string) {
    const vectorLayer = this.vectorLayers.get(layerId);
    if (vectorLayer) {
      vectorLayer.getSource()?.clear();
    }
    const vectorLayers = this.vectorLayerGroup.getLayers();
    vectorLayers.remove(layer);
    this.vectorLayerGroup.setLayers(vectorLayers);
    this.vectorLayers.delete(layerId);
    return;
  }

  private createLayer(layer: LayerModel, useProjection?: string): LayerTypes {
    if (LayerTypesHelper.isVectorLayer(layer)) {
      return this.createVectorLayer(layer);
    }
    let olLayer = OlLayerHelper.createLayer(layer, this.olMap.getView().getProjection(), this.ngZone, this.httpXsrfTokenExtractor);
    if (useProjection) {
      olLayer = OlLayerHelper.createLayer(layer, getProjection(useProjection)!, this.ngZone, this.httpXsrfTokenExtractor);
    }
    if (!olLayer) {
      return null;
    }
    if (typeof layer.opacity === 'number') {
      olLayer.setOpacity(layer.opacity / 100);
    }
    return olLayer;
  }

  private createVectorLayer(layer: VectorLayerModel): VectorLayer | null {
    const updateWhileAnimating = layer.updateWhileAnimating ?? false;
    const source = new VectorSource({ wrapX: true });
    const vectorLayer = new VectorLayer({ source, visible: layer.visible, updateWhileAnimating, updateWhileInteracting: updateWhileAnimating });
    this.vectorLayers.set(layer.id, vectorLayer);
    return vectorLayer;
  }
}
