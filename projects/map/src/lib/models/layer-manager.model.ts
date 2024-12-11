import { LayerModel } from './layer.model';
import { Vector as VectorLayer, Image as ImageLayer, Tile as TileLayer } from 'ol/layer';
import { ImageWMS, WMTS, XYZ, TileWMS } from 'ol/source';
import { Cesium3DTileset } from 'cesium';

export type LayerTypes = VectorLayer | TileLayer<TileWMS> |
  ImageLayer<ImageWMS> | TileLayer<XYZ> | TileLayer<WMTS> | null;
export type LayerTypes3D = Promise<Cesium3DTileset>  | null;

export interface LayerManagerModel {
  setBackgroundLayers(layers: LayerModel[]): void;
  setLayers(layers: LayerModel[]): void;
  addLayer<LayerType extends LayerTypes>(layer: LayerModel): LayerType | null;
  addLayers(layers: LayerModel[]): void;
  removeLayer(layerId: string): void;
  removeLayers(layerIds: string[]): void;
  setLayerVisibility(layerId: string, visible: boolean): void;
  setLayerOpacity(layerId: string, opacity: number): void;
  setLayerOrder(layerIds: string[]): void;
  refreshLayer(layerId: string): void;
  getLegendUrl(layerId: string): string;
}
