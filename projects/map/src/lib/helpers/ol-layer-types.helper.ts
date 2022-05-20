import BaseLayer from 'ol/layer/Base';
import VectorLayer from 'ol/layer/Vector';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import Geometry from 'ol/geom/Geometry';
import VectorSource from 'ol/source/Vector';
import ImageWMS from 'ol/source/ImageWMS';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';

export const isOpenLayersVectorLayer = (layer: BaseLayer): layer is VectorLayer<VectorSource<Geometry>> => {
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
