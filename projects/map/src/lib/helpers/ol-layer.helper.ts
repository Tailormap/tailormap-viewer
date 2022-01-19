import BaseLayer from 'ol/layer/Base';
import Projection from 'ol/proj/Projection';
import ImageLayer from 'ol/layer/Image';
import TileLayer from  'ol/layer/Tile';
import ImageWMS from 'ol/source/ImageWMS';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import { StyleFunction } from 'ol/style/Style';
import { Options as WMTSOptions, optionsFromCapabilities } from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { TMSLayerModel } from '../models/tms-layer.model';
import VectorImageLayer from 'ol/layer/VectorImage';
import { LayerTypesHelper } from './layer-types.helper';
import { OgcHelper } from './ogc.helper';
import { LayerModel } from '../models/layer.model';
import { WMSLayerModel } from '../models/wms-layer.model';
import { WMTSService } from '../models/wmts-service.model';
import { LayerTypesEnum } from '../models/layer-types.enum';
import { Service } from '../models/service.model';
import { WMTSLayerModel } from '../models/wmts-layer.model';
import { ServiceTypesHelper } from './service-types.helper';
import Geometry from 'ol/geom/Geometry';

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

  public static getWMTSLayerModelFromCapabilities(
    service: WMTSService,
    layer: string,
    matrixSet?: string,
  ): Omit<WMTSLayerModel, 'id' | 'name' | 'visible'> {
    const unfrozenCaps = JSON.parse(JSON.stringify(service.capabilities));
    const options = optionsFromCapabilities(unfrozenCaps, {
      layer,
      matrixSet,
    });
    if (options === null) {
      throw new Error('Options missing in Capabilities');
    }
    const tileSize = options.tileGrid.getTileSize(0);
    const projection = typeof options.projection === 'undefined'
      ? undefined
      : typeof options.projection === 'string' ?
        options.projection :
        options.projection.getCode();
    return {
      layerType: LayerTypesEnum.WMTS,
      url: service.url,
      layers: layer,
      matrixSet: options.matrixSet,
      format: options.format,
      projection,
      resolutions: options.tileGrid.getResolutions(),
      matrixIds: options.tileGrid.getMatrixIds(),
      tileSizes: Array.isArray(tileSize) ? [[ tileSize[0], tileSize[1] ]] : [[ tileSize, tileSize ]],
      extent: options.tileGrid.getExtent(),
      origins: [ options.tileGrid.getOrigin(0) ],
      tilePixelRatio: options.tilePixelRatio,
    };
  }

  public static createLayer(layer: LayerModel, projection: Projection, service?: Service): ImageLayer<ImageWMS> | TileLayer<XYZ> | TileLayer<WMTS> | null {
    if (LayerTypesHelper.isTmsLayer(layer)) {
      return OlLayerHelper.createTMSLayer(layer, projection);
    }
    if (LayerTypesHelper.isWmsLayer(layer)) {
      return OlLayerHelper.createWMSLayer(layer);
    }
    if (LayerTypesHelper.isWmtsLayer(layer) && service && ServiceTypesHelper.isWMTSService(service)) {
      return OlLayerHelper.createWMTSLayer(layer, service);
    }
    if (LayerTypesHelper.isWmtsLayer(layer)) {
      return OlLayerHelper.createWMTSLayer(layer);
    }
    return null;
  }

  /**
   * service is optional but can be passed to set the WMTSLayerModel properties from the WMTS Capabilities
   */
  public static createWMTSLayer(layer: WMTSLayerModel, service?: WMTSService): TileLayer<WMTS> {
    if (service) {
      layer = {
        ...layer,
        ...OlLayerHelper.getWMTSLayerModelFromCapabilities(service, layer.layers, layer.matrixSet),
      };
    }
    const options: WMTSOptions = {
      layer: layer.layers,
      style: 'default',
      matrixSet: layer.matrixSet,
      projection: layer.projection,
      format: layer.format,
      url: OgcHelper.filterOgcUrlParameters(layer.url),
      tilePixelRatio: layer.tilePixelRatio,
      tileGrid: new WMTSTileGrid({
        resolutions: layer.resolutions,
        matrixIds: layer.matrixIds,
        tileSizes: layer.tileSizes,
        extent: layer.extent,
        origins: layer.origins,
      }),
      crossOrigin: layer.crossOrigin,
    };
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
