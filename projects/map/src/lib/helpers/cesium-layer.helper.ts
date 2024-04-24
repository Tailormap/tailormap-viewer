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
import { Cesium3DTileset } from 'cesium';
import { Tileset3DLayerModel } from '../models/tileset3D-layer.model';


const MAX_URL_LENGTH_BEFORE_POST = 4096;

export class CesiumLayerHelper {

  public static create3DLayer(
    layer: LayerModel,
  ): Promise<Cesium3DTileset> | null {
    if (LayerTypesHelper.isTileset3DLayer(layer)) {
      return CesiumLayerHelper.createTileset3DLayer(layer);
    }
    return null;
  }

  public static async createTileset3DLayer(layer: Tileset3DLayerModel): Promise<Cesium3DTileset> {
    let url = layer.url;

    return await Cesium3DTileset.fromUrl(url);

  }
}
