import { LayerModel } from './layer.model';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Geometry } from 'ol/geom';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import { TileWMS } from 'ol/source';

import { CanvasOrWebGLTileLayer } from '../helpers/ol-layer-types.helper';

export type LayerTypes =
  VectorLayer<VectorSource<Geometry>>
  | CanvasOrWebGLTileLayer<TileWMS>
  | ImageLayer<ImageWMS>
  | CanvasOrWebGLTileLayer<XYZ>
  | CanvasOrWebGLTileLayer<WMTS>
  | null;

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
