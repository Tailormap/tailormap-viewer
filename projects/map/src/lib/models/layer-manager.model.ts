import { LayerModel } from './layer.model';
import VectorImageLayer from 'ol/layer/VectorImage';
import VectorSource from 'ol/source/Vector';
import { Geometry } from 'ol/geom';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import ImageWMS from 'ol/source/ImageWMS';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';

export type LayerTypes = VectorImageLayer<VectorSource<Geometry>> | ImageLayer<ImageWMS> | TileLayer<XYZ> | TileLayer<WMTS> | null;

export interface LayerManagerModel {
  setBackgroundLayer(layer: LayerModel): void;
  setLayers(layers: LayerModel[]): void;
  addLayer(layer: LayerModel): LayerTypes;
  addLayers(layers: LayerModel[]): void;
  removeLayer(layerId: string): void;
  removeLayers(layerIds: string[]): void;
  setLayerVisibility(layerId: string, visible: boolean): void;
  setLayerOpacity(layerId: string, opacity: number): void;
  setLayerOrder(layerIds: string[]): void;
  refreshLayer(layerId: string): void;
}
