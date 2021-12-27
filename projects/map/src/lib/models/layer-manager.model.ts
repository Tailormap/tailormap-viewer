import { LayerModel } from './layer.model';
import { Service } from './service.model';
import { Observable } from 'rxjs';
import VectorImageLayer from 'ol/layer/VectorImage';
import VectorSource from 'ol/source/Vector';
import { Geometry } from 'ol/geom';
import { Image as ImageLayer, Tile as TileLayer } from 'ol/layer';
import { ImageWMS, XYZ } from 'ol/source';
import WMTS from 'ol/source/WMTS';

export type LayerTypes = VectorImageLayer<VectorSource<Geometry>> | ImageLayer<ImageWMS> | TileLayer<XYZ> | TileLayer<WMTS> | null;

export interface LayerManagerModel {
  setBackgroundLayer(layer: LayerModel): void;
  addLayer(layer: LayerModel, service?: Service): LayerTypes;
  addLayers(layers: LayerModel[], services?: Service[]): void;
  removeLayer(layerId: string): void;
  removeLayers(layerIds: string[]): void;
  setLayerVisibility(layerId: string, visible: boolean): void;
  setLayerOpacity(layerId: string, opacity: number): void;
  setLayerOrder(layerIds: string[]): void;
  refreshLayer(layerId: string): void;
}
