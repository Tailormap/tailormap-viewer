import { LayerTypesHelper } from './layer-types.helper';
import { LayerModel } from '../models/layer.model';
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

    return await Cesium.Cesium3DTileset.fromUrl(url);

  }
}
