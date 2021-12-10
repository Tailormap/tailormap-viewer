import BaseLayer from 'ol/layer/Base';
import Projection from 'ol/proj/Projection';
import { Image as ImageLayer, Tile as TileLayer } from 'ol/layer';
import { ImageWMS, WMTS, XYZ } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { StyleFunction } from 'ol/style/Style';
import { Options as WMTSOptions, optionsFromCapabilities } from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { TMSLayerModel } from '../models/tms-layer.model';
import ImageWrapper from 'ol/Image';
import VectorImageLayer from 'ol/layer/VectorImage';
import { Tile } from 'ol';
import TileState from 'ol/TileState';
import { NgZone } from '@angular/core';
import { LayerTypesHelper } from './layer-types.helper';
import { OgcHelper } from './ogc.helper';
import { LayerModel } from '../models/layer.model';
import { WMSLayerModel } from '../models/wms-layer.model';
import { WMTSService } from '../models/wmts-service.model';
import { LayerTypesEnum } from '../models/layer-types.enum';
import { AuthorizationFunction, Service } from '../models/service.model';
import { WMTSLayerModel } from '../models/wmts-layer.model';
import { ServiceTypesHelper } from './service-types.helper';
import { Geometry } from 'ol/geom';

export interface LayerProperties {
  id: string;
  visible: boolean;
  name: string;
  authentication?: string | AuthorizationFunction;
}

export class OlLayerHelper {

  constructor(private ngZone: NgZone) {
  }

  public static setLayerProps(layer: LayerModel, olLayer: BaseLayer) {
    let authentication;
    if (LayerTypesHelper.isWmsLayer(layer) || LayerTypesHelper.isWmtsLayer(layer)) {
      authentication = layer.authentication;
    }
    const layerProps: LayerProperties = {
      id: layer.id,
      visible: layer.visible,
      name: layer.name,
      authentication,
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

  public createLayer(layer: LayerModel, projection: Projection, service?: Service): BaseLayer | null {
    if (LayerTypesHelper.isTmsLayer(layer)) {
      return this.createTMSLayer(layer, projection);
    }
    if (LayerTypesHelper.isWmsLayer(layer)) {
      return this.createWMSLayer(layer);
    }
    if (LayerTypesHelper.isWmtsLayer(layer) && service && ServiceTypesHelper.isWMTSService(service)) {
      return this.createWMTSLayer(layer, service);
    }
    if (LayerTypesHelper.isWmtsLayer(layer)) {
      return this.createWMTSLayer(layer);
    }
    return null;
  }

  /**
   * service is optional but can be passed to set the WMTSLayerModel properties from the WMTS Capabilities
   */
  public createWMTSLayer(layer: WMTSLayerModel, service?: WMTSService): BaseLayer {
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
    if (layer.authentication) {
      const auth = layer.authentication;
      source.setTileLoadFunction((tile: Tile, src) => {
        this.authorizedTileLoader(tile, src, auth);
      });
    }
    return new TileLayer({
      visible: layer.visible,
      source,
    });
  }

  public createTMSLayer(layer: TMSLayerModel, projection: Projection): BaseLayer {
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

  public createVectorLayer(layer: LayerModel, source: VectorSource<Geometry>, stylingFn?: StyleFunction): VectorImageLayer<VectorSource<Geometry>> {
    return new VectorImageLayer({ source, visible: layer.visible, style: stylingFn });
  }

  public createWMSLayer(layer: WMSLayerModel): BaseLayer {
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
    const l = new ImageLayer({
      visible: layer.visible,
      source,
    });
    if (layer.authentication) {
      const auth = layer.authentication;
      source.setImageLoadFunction ((tile: ImageWrapper, src) => {
         this.authorizedImageLoader(tile, src, auth);
      });
    }
    return l;
  }

  public authorizedImageLoader(tile: ImageWrapper, src: string, authentication: string | AuthorizationFunction) {
    // From https://stackoverflow.com/questions/50471595/openlayers-4-load-wms-image-layer-require-authentication
    // https://openlayers.org/en/latest/apidoc/module-ol_Tile.html#~LoadFunction

    this.ngZone.runOutsideAngular(() => {
      const headers: HeadersInit = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: typeof authentication === 'function' ? authentication(src) : authentication,
      };
      fetch(src, {headers, credentials: 'include'}).then(response => {
        if (response.ok) {
          response.blob().then(blob => {
            // Missing from typing
            const image: HTMLImageElement = (tile as any).getImage();
            const url = URL.createObjectURL(blob);
            image.src = url;
            image.onload = () => {
              URL.revokeObjectURL(url);
            };
          });
        } else {
          // Error status, we could report that to the user, perhaps show ServiceException
        }
      }, () => {
        // Network error
      });
    });
  }

  public authorizedTileLoader(tile: Tile, src: string, authentication: string | AuthorizationFunction) {
    // https://openlayers.org/en/latest/apidoc/module-ol_Tile.html#~LoadFunction

    this.ngZone.runOutsideAngular(() => {
      const headers: HeadersInit = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: typeof authentication === 'function' ? authentication(src) : authentication,
      };
      fetch(src, {headers, credentials: 'include'}).then(response => {
        if (response.ok) {
          response.blob().then(blob => {
            // Missing from typing
            const image: HTMLImageElement = (tile as any).getImage();
            const url = URL.createObjectURL(blob);
            image.src = url;
            image.onload = () => {
              URL.revokeObjectURL(url);
            };
          });
        } else {
          tile.setState(TileState.ERROR);
        }
      }, () => {
        tile.setState(TileState.ERROR);
      });
    });
  }

}
