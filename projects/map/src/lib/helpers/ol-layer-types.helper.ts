import BaseLayer from 'ol/layer/Base';
import VectorLayer from 'ol/layer/Vector';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import VectorImageLayer from 'ol/layer/VectorImage';
import Geometry from 'ol/geom/Geometry';
import VectorSource from 'ol/source/Vector';
import ImageSource from 'ol/source/Image';
import TileSource from 'ol/source/Tile';

export const isOpenLayersVectorLayer = (layer: BaseLayer): layer is VectorLayer<VectorSource<Geometry>> => {
  return layer instanceof VectorLayer;
};

export const isOpenLayersVectorImageLayer = (layer: BaseLayer): layer is VectorImageLayer<VectorSource<Geometry>> => {
  return layer instanceof VectorImageLayer;
};

export const isOpenLayersWMSLayer = (layer: BaseLayer): layer is ImageLayer<ImageSource> => {
  return layer instanceof ImageLayer;
};

export const isOpenLayersTMSLayer = (layer: BaseLayer): layer is TileLayer<TileSource> => {
  return layer instanceof TileLayer;
};

export const isPossibleRealtimeLayer = (layer: BaseLayer): layer is TileLayer<TileSource> | ImageLayer<ImageSource> => {
  return isOpenLayersTMSLayer(layer) || isOpenLayersWMSLayer(layer);
};
