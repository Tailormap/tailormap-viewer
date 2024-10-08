import { Layer as BaseLayer } from 'ol/layer';
import { Vector as VectorLayer, Image as ImageLayer, Tile as TileLayer } from 'ol/layer';
import { ImageWMS, WMTS, XYZ, TileWMS } from 'ol/source';

export const isOpenLayersVectorLayer = (layer: BaseLayer): layer is VectorLayer => {
  return layer instanceof VectorLayer;
};

export const isOpenLayersWMSLayer = (layer: BaseLayer): layer is ImageLayer<ImageWMS> | TileLayer<TileWMS> => {
  return layer instanceof ImageLayer && layer.getSource() instanceof ImageWMS
    || layer instanceof TileLayer && layer.getSource() instanceof TileWMS;
};

export const isOpenLayersWMTSLayer = (layer: BaseLayer): layer is TileLayer<WMTS> => {
  return layer instanceof TileLayer && layer.getSource() instanceof WMTS;
};

export const isOpenLayersTMSLayer = (layer: BaseLayer): layer is TileLayer<XYZ> => {
  return layer instanceof TileLayer && layer.getSource() instanceof XYZ;
};

export const isPossibleRealtimeLayer = (layer: BaseLayer): layer is TileLayer<XYZ> | ImageLayer<ImageWMS> => {
  return isOpenLayersTMSLayer(layer) || isOpenLayersWMSLayer(layer);
};
