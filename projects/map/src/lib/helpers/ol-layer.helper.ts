import BaseLayer from 'ol/layer/Base';
import Projection from 'ol/proj/Projection';
import ImageLayer from 'ol/layer/Image';
import TileLayer from  'ol/layer/Tile';
import ImageWMS from 'ol/source/ImageWMS';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import { StyleFunction } from 'ol/style/Style';
import { optionsFromCapabilities } from 'ol/source/WMTS';
import { TMSLayerModel } from '../models/tms-layer.model';
import VectorImageLayer from 'ol/layer/VectorImage';
import { LayerTypesHelper } from './layer-types.helper';
import { OgcHelper } from './ogc.helper';
import { LayerModel } from '../models/layer.model';
import { WMSLayerModel } from '../models/wms-layer.model';
import { WMTSLayerModel } from '../models/wmts-layer.model';
import Geometry from 'ol/geom/Geometry';
import { WMTSCapabilities } from 'ol/format';

export interface LayerProperties {
  id: string;
  visible: boolean;
  name: string;
}

export class OlLayerHelper {

  public static setLayerProps(layer: LayerModel, olLayer: BaseLayer) {
    const layerProps: LayerProperties = {
      id: layer.id,
      visible: layer.visible,
      name: layer.name,
    };
    olLayer.setProperties(layerProps);
  }

  public static createLayer(layer: LayerModel, projection: Projection): ImageLayer<ImageWMS> | TileLayer<XYZ> | TileLayer<WMTS> | null {
    if (LayerTypesHelper.isTmsLayer(layer)) {
      return OlLayerHelper.createTMSLayer(layer, projection);
    }
    if (LayerTypesHelper.isWmsLayer(layer)) {
      return OlLayerHelper.createWMSLayer(layer);
    }
    if (LayerTypesHelper.isWmtsLayer(layer)) {
      return OlLayerHelper.createWMTSLayer(layer, projection);
    }
    return null;
  }

  /**
   * service is optional but can be passed to set the WMTSLayerModel properties from the WMTS Capabilities
   */
  public static createWMTSLayer(layer: WMTSLayerModel, projection: Projection): TileLayer<WMTS> | null {
    const parser = new WMTSCapabilities();
    const capabilities = parser.read(layer.capabilities);
    const options = optionsFromCapabilities(capabilities, {
      layer: layer.layers,
      matrixSet: projection.getCode(),
    });
    if (options === null) {
      return null;
    }
    const source = new WMTS(options);
    return new TileLayer({
      visible: layer.visible,
      source,
    });
  }

  public static createTMSLayer(layer: TMSLayerModel, projection: Projection): TileLayer<XYZ> {
    return new TileLayer({
      visible: layer.visible,
      source: new XYZ({
        ...layer.xyzOptions,
        crossOrigin: layer.crossOrigin,
        projection,
        tilePixelRatio: layer.tilePixelRatio,
      }),
    });
  }

  public static createVectorLayer(layer: LayerModel, source: VectorSource<Geometry>, stylingFn?: StyleFunction): VectorImageLayer<VectorSource<Geometry>> {
    return new VectorImageLayer({ source, visible: layer.visible, style: stylingFn });
  }

  public static createWMSLayer(layer: WMSLayerModel): ImageLayer<ImageWMS> {
    const source = new ImageWMS({
      url: OgcHelper.filterOgcUrlParameters(layer.url),
      params: {
        LAYERS: layer.layers,
        VERSION: '1.1.1',
        QUERY_LAYERS: layer.queryLayers,
        TRANSPARENT: 'TRUE',
      },
      crossOrigin: layer.crossOrigin,
    });
    return new ImageLayer({
      visible: layer.visible,
      source,
    });
  }

}
