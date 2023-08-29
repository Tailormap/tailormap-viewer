import BaseLayer from 'ol/layer/Base';
import VectorLayer from 'ol/layer/Vector';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import Geometry from 'ol/geom/Geometry';
import VectorSource from 'ol/source/Vector';
import ImageWMS from 'ol/source/ImageWMS';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import TileImage from 'ol/source/TileImage';
import DataTile from 'ol/source/DataTile';

/**
 * Wrapper around WebGLTileLayer that makes getSource typed.
 */
export interface TypedWebGLTileLayer<T extends (TileImage | DataTile)> extends WebGLTileLayer {
    getSource(): T | null;
}

export type CanvasOrWebGLTileLayer<T extends TileImage> = TileLayer<T> | TypedWebGLTileLayer<T>;

export const isOpenLayersVectorLayer = (layer: BaseLayer): layer is VectorLayer<VectorSource<Geometry>> => {
  return layer instanceof VectorLayer;
};

export const isOpenLayersWMSLayer = (layer: BaseLayer): layer is ImageLayer<ImageWMS> | CanvasOrWebGLTileLayer<TileWMS> => {
  return layer instanceof ImageLayer && layer.getSource() instanceof ImageWMS
    || (layer instanceof TileLayer || layer instanceof WebGLTileLayer) && layer.getSource() instanceof TileWMS;
};

export const isOpenLayersWMTSLayer = (layer: BaseLayer): layer is CanvasOrWebGLTileLayer<WMTS> => {
  return (layer instanceof TileLayer || layer instanceof WebGLTileLayer) && layer.getSource() instanceof WMTS;

};

export const isOpenLayersTMSLayer = (layer: BaseLayer): layer is CanvasOrWebGLTileLayer<XYZ> => {
  return (layer instanceof TileLayer || layer instanceof WebGLTileLayer) && layer.getSource() instanceof XYZ;
};

export const isPossibleRealtimeLayer = (layer: BaseLayer): layer is CanvasOrWebGLTileLayer<XYZ> | ImageLayer<ImageWMS> => {
  return isOpenLayersTMSLayer(layer) || isOpenLayersWMSLayer(layer);
};
