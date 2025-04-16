import { Layer as BaseLayer } from 'ol/layer';
import { Projection } from 'ol/proj';
import { Tile as TileLayer, Image as ImageLayer } from 'ol/layer';
import { ImageWMS, WMTS, XYZ, TileWMS } from 'ol/source';
import { optionsFromCapabilities } from 'ol/source/WMTS';
import { XyzLayerModel } from '../models/xyz-layer.model';
import { LayerTypesHelper } from './layer-types.helper';
import { OgcHelper } from './ogc.helper';
import { LayerModel } from '../models/layer.model';
import { WMSLayerModel } from '../models/wms-layer.model';
import { WMTSLayerModel } from '../models/wmts-layer.model';
import { WMTSCapabilities } from 'ol/format';
import { default as WMTSTileGrid } from 'ol/tilegrid/WMTS';
import { Options } from 'ol/source/ImageWMS';
import { ServerType } from 'ol/source/wms';
import { ServerType as TMServerType } from '@tailormap-viewer/api';
import { ObjectHelper } from '@tailormap-viewer/shared';
import { ImageTile } from 'ol';
import { NgZone } from '@angular/core';
import { default as TileState } from 'ol/TileState';
import { createForProjection, createXYZ, extentFromProjection } from 'ol/tilegrid';
import { HttpXsrfTokenExtractor } from '@angular/common/http';
import { default as TileGrid } from 'ol/tilegrid/TileGrid';
import { get as getProjection } from 'ol/proj.js';
import { PROJECTION_REQUIRED_FOR_3D } from '../models/3d-projection.const';

export interface LayerProperties {
  id: string;
  visible: boolean;
  name: string;
  filter?: string;
  language?: string;
}

interface WmsServiceParamsModel {
  LAYERS: string;
  VERSION: string;
  QUERY_LAYERS?: string;
  TRANSPARENT: string;
  CQL_FILTER?: string;
  CACHE?: number;
  LANGUAGE?: string;
}

const MAX_URL_LENGTH_BEFORE_POST = 4096;

export class OlLayerHelper {

  public static setLayerProps(layer: LayerModel, olLayer: BaseLayer) {
    const layerProps: LayerProperties = {
      id: layer.id,
      visible: layer.visible,
      name: layer.name,
      filter: LayerTypesHelper.isServiceLayer(layer) ? layer.filter : undefined,
    };
    olLayer.setProperties(layerProps);
  }

  public static getLayerProps(olLayer: BaseLayer): LayerProperties {
    const props = olLayer.getProperties();
    if (!ObjectHelper.hasProperties(props, [ 'id', 'visible', 'name' ])) {
      return { id: '', visible: false, name: 'Invalid layer' };
    }
    return {
      id: props['id'],
      visible: props['visible'],
      name: props['name'],
      filter: props['filter'],
    };
  }

  public static createLayer(
    layer: LayerModel,
    projection: Projection,
    ngZone?: NgZone,
    httpXsrfTokenExtractor?: HttpXsrfTokenExtractor,
  ): TileLayer<TileWMS> | ImageLayer<ImageWMS> | TileLayer<XYZ> | TileLayer<WMTS> | null {
    if (LayerTypesHelper.isXyzLayer(layer)) {
      return OlLayerHelper.createXYZLayer(layer, projection);
    }
    if (LayerTypesHelper.isWmsLayer(layer)) {
      return OlLayerHelper.createWMSLayer(layer, projection, ngZone, httpXsrfTokenExtractor);
    }
    if (LayerTypesHelper.isWmtsLayer(layer)) {
      return OlLayerHelper.createWMTSLayer(layer, projection);
    }
    return null;
  }

  private static layerHiDpi(layer: LayerModel) {
    return (layer.tilePixelRatio || window.devicePixelRatio) > 1 && !layer.hiDpiDisabled;
  }

  /**
   * service is optional but can be passed to set the WMTSLayerModel properties from the WMTS Capabilities
   */
  public static createWMTSLayer(layer: WMTSLayerModel, projection: Projection): TileLayer<WMTS> | null {
    const parser = new WMTSCapabilities();
    const capabilities = parser.read(layer.capabilities);

    const hiDpi = OlLayerHelper.layerHiDpi(layer);
    const hiDpiLayer = layer.hiDpiSubstituteLayer || layer.layers;

    const options = optionsFromCapabilities(capabilities, {
      layer: hiDpi ? hiDpiLayer : layer.layers,
      projection: projection.getCode(),
    });
    if (options === null) {
      return null;
    }
    options.crossOrigin = layer.crossOrigin;

    if (hiDpi) {
      const hiDpiMode = layer.hiDpiMode || 'showNextZoomLevel';
      // For WMTS with hiDpiMode == 'substituteLayerTilePixelRatioOnly' just setting this option suffices. The service should send tiles with
      // 2x the width and height as it advertises in the capabilities.
      options.tilePixelRatio = 2;

      // For WMTS layers with these options, the service sends the tile sizes as advertised (advised to use larger tiles than 256x256), but
      // the tiles are DPI-independent (for instance an aero photo) or are rendered with high DPI (different layer name).
      if (hiDpiMode === 'showNextZoomLevel' || hiDpiMode === 'substituteLayerShowNextZoomLevel') {
        // To use with the OL tilePixelRatio option, we need to halve the tile width and height and double the resolutions to fake the
        // capabilities to make the service look like it sends 2x the tile width/height and pick the tile for a deeper zoom level, so
        // sharper details per intrinsic CSS pixel are displayed.

        let tileSize = options.tileGrid.getTileSize(0);
        if (Array.isArray(tileSize)) {
          tileSize = (tileSize as number[]).map(value => value / 2);
        } else {
          tileSize = (tileSize as number) / 2;
        }

        const resolutions = options.tileGrid.getResolutions().map(value => value * 2);

        options.tileGrid = new WMTSTileGrid({
          extent: options.tileGrid.getExtent(),
          origin: options.tileGrid.getOrigin(0),
          resolutions,
          matrixIds: options.tileGrid.getMatrixIds(),
          tileSize,
        });
      }
    }

    // Replace url by url from layer object, which may refer to the proxy endpoint of tailormap-api. This only works with KVP
    // encoding for the moment
    if (options.requestEncoding === 'KVP') {
      delete options.urls;
      delete options.url;
      options.url = layer.url;
    }

    options.attributions = layer.attribution ? [layer.attribution] : undefined;

    const source = new WMTS(options);
    return new TileLayer({
      visible: layer.visible,
      source,
    });
  }

  public static createXYZLayer(layer: XyzLayerModel, projection: Projection): TileLayer<XYZ> {
    const hiDpi = OlLayerHelper.layerHiDpi(layer);

    let url = layer.url;
    let tilePixelRatio;
    let tileGrid = undefined;

    const minZoom = layer.minZoom || 0;
    const maxZoom = layer.maxZoom || 21;
    const tileSize = layer.tileSize || 256;
    const extent = layer.tileGridExtent
      ? [ layer.tileGridExtent.minx,  layer.tileGridExtent.miny,  layer.tileGridExtent.maxx,  layer.tileGridExtent.maxy ]
      : extentFromProjection(projection);

    tileGrid = createXYZ({
      extent,
      tileSize,
      maxZoom,
      minZoom,
    });

    if (hiDpi) {
      if (layer.hiDpiMode === 'substituteLayerTilePixelRatioOnly' && layer.hiDpiSubstituteUrl) {
        url = layer.hiDpiSubstituteUrl;
        tilePixelRatio = 2;
      } else if (layer.hiDpiMode === 'showNextZoomLevel' || (layer.hiDpiMode === 'substituteLayerShowNextZoomLevel' && layer.hiDpiSubstituteUrl)) {
        // Adjust tile grid to show next zoomlevel at hi DPI similar to WMTS
        tileGrid = new TileGrid({
          extent: tileGrid.getExtent(),
          origin: tileGrid.getOrigin(0),
          resolutions: tileGrid.getResolutions().map(value => value * 2),
          tileSize: tileSize / 2,
        });
        if (layer.hiDpiMode === 'substituteLayerShowNextZoomLevel' && layer.hiDpiSubstituteUrl) {
          url = layer.hiDpiSubstituteUrl;
        }
      }
    }

    const source = new XYZ({
      url,
      maxZoom,
      minZoom,
      crossOrigin: layer.crossOrigin,
      projection,
      tileGrid,
      tilePixelRatio,
      attributions: layer.attribution ? [layer.attribution] : undefined,
    });

    return new TileLayer({
      visible: layer.visible,
      source,
    });
  }

  public static createWMSLayer(
    layer: WMSLayerModel,
    projection: Projection,
    ngZone?: NgZone,
    httpXsrfTokenExtractor?: HttpXsrfTokenExtractor,
  ): TileLayer<TileWMS> | ImageLayer<ImageWMS> {
    let serverType: ServerType | undefined;
    let hidpi = true;

    // If explicitly disabled or no server type known do not use serverType for hidpi
    if (layer.hiDpiDisabled !== false || layer.serverType === TMServerType.GENERIC) {
      serverType = undefined;
      hidpi = false;
    } else {
      serverType = layer.serverType;
    }

    const sourceOptions: Options = {
      url: OgcHelper.filterOgcUrlParameters(layer.url),
      params: OlLayerHelper.getWmsServiceParams(layer),
      crossOrigin: layer.crossOrigin,
      serverType,
      hidpi,
      attributions: layer.attribution ? [layer.attribution] : undefined,
    };

    if (layer.tilingDisabled) {
      const source = new ImageWMS(sourceOptions);
      source.set('olcs_projection', getProjection(PROJECTION_REQUIRED_FOR_3D));
      return new ImageLayer({
        visible: layer.visible,
        source,
      });
    } else {
      const tileLoadFunction = !(ngZone && httpXsrfTokenExtractor) ? null : OlLayerHelper.getWmsPOSTTileLoadFunction(
        ngZone,
        httpXsrfTokenExtractor,
        MAX_URL_LENGTH_BEFORE_POST,
        ['CQL_FILTER']);
      const tileGrid = createForProjection(projection, undefined, 512);
      const source = new TileWMS({
        ...sourceOptions as any,
        gutter: layer.tilingGutter || 0,
        tileLoadFunction,
        tileGrid,
      });
      source.set('olcs_tileLoadFunction', tileLoadFunction);
      return new TileLayer({
        visible: layer.visible,
        source,
      });
    }
  }

  private static getWmsPOSTTileLoadFunction(ngZone: NgZone, httpXsrfTokenExtractor: HttpXsrfTokenExtractor, maxUrlLength: number, paramsToPutInBody: string[]) {
    return (tile: ImageTile, src: string) => {
      if (src.length > maxUrlLength) {
        ngZone.runOutsideAngular(() => {
          const url = new URL(src);
          const body = new URLSearchParams();
          paramsToPutInBody.forEach(param => {
            if (url.searchParams.has(param)) {
              body.set(param, url.searchParams.get(param) as string);
              url.searchParams.delete(param);
            }
          });
          const headers = new Headers();
          headers.set('Content-Type', 'application/x-www-form-urlencoded');
          const locationURL = new URL(location.href);
          const requestURL = new URL(src);
          const sameOrigin = locationURL.protocol === requestURL.protocol && locationURL.host === requestURL.host;
          if (sameOrigin) {
            headers.set('X-XSRF-TOKEN', httpXsrfTokenExtractor.getToken() || '');
          }
          fetch(url.toString(), {
            method: 'POST',
            headers,
            body,
          }).then(response => {
            if (response.ok) {
              response.blob().then(blob => {
                const image: HTMLImageElement = tile.getImage() as HTMLImageElement;
                const objectUrl = URL.createObjectURL(blob);
                image.src = objectUrl;
                image.onload = () => {
                  URL.revokeObjectURL(objectUrl);
                };
              });
            } else {
              tile.setState(TileState.ERROR);
            }
          });
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        tile.getImage().src = src;
      }
    };
  }

  public static getWmsServiceParams(layer: WMSLayerModel, addCacheBust?: boolean): WmsServiceParamsModel {
    const params: WmsServiceParamsModel = {
      LAYERS: layer.layers,
      VERSION: '1.1.1',
      QUERY_LAYERS: layer.queryLayers,
      TRANSPARENT: 'TRUE',
    };
    if (layer.filter && layer.serverType === TMServerType.GEOSERVER) {
      // TODO: implement filtering for other servers than geoserver (transform CQL to SLD for SLD_BODY param)
      params.CQL_FILTER = layer.filter;
    }
    if (layer.serverType === TMServerType.GEOSERVER && layer.language) {
      params.LANGUAGE = layer.language;
    }
    if (addCacheBust) {
      params.CACHE = Date.now();
    }
    return params;
  }

}
