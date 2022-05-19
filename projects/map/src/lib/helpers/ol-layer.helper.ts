import BaseLayer from 'ol/layer/Base';
import Projection from 'ol/proj/Projection';
import ImageLayer from 'ol/layer/Image';
import TileLayer from  'ol/layer/Tile';
import ImageWMS from 'ol/source/ImageWMS';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import { optionsFromCapabilities } from 'ol/source/WMTS';
import { TMSLayerModel } from '../models/tms-layer.model';
import { LayerTypesHelper } from './layer-types.helper';
import { OgcHelper } from './ogc.helper';
import { LayerModel } from '../models/layer.model';
import { WMSLayerModel } from '../models/wms-layer.model';
import { WMTSLayerModel } from '../models/wmts-layer.model';
import { WMTSCapabilities } from 'ol/format';
import WMTSTileGrid from 'ol/tilegrid/WMTS';

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

    const hiDpi = window.devicePixelRatio > 1;
    let serviceHiDpi = false;
    let hiDpiLayer = layer.layers;

    // XXX hardcoded for now, in the future get this from the layer when configurable via admin interface
    if (layer.url.includes("openbasiskaart.nl") && layer.layers == "osm") {
      serviceHiDpi = true;
      hiDpiLayer = "osm-hq";
    }
    if (layer.url.includes("service.pdok.nl/hwh/luchtfotorgb")) {
      serviceHiDpi = true;
    }

    const options = optionsFromCapabilities(capabilities, {
      layer: hiDpi ? hiDpiLayer : layer.layers,
      matrixSet: projection.getCode(),
    });
    if (options === null) {
      return null;
    }

    if (serviceHiDpi) {
      options.tilePixelRatio = hiDpi ? 2 : 1;

      // tilePixelRatio is for a service that advertises tile size x * y but actually sends tiles (2x) * (2y). However, a service like
      // openbasiskaart has a layer with just higher DPI but advertises a correct tile size (although it is 512). To display a sharper
      // image we need to adjust the resolutions of the WMTSTileGrid so OpenLayers uses a higher zoom level but scaled down for a sharper image.

      // An aerophoto service has no DPI dependent rendering, just display tiles at half size for a sharper image.

      let tileSize = options.tileGrid.getTileSize(0);
      if (Array.isArray(tileSize)) {
        tileSize = (tileSize as number[]).map(value => value / 2);
      } else {
        tileSize = (tileSize as number) / 2;
      }

      options.tileGrid = new WMTSTileGrid({
        extent: options.tileGrid.getExtent(),
        origin: options.tileGrid.getOrigin(0),
        resolutions: options.tileGrid.getResolutions().map(value => value * 2),
        matrixIds: options.tileGrid.getMatrixIds(),
        tileSize
      });
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
