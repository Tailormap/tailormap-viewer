import { LayerModel } from '../models/layer.model';
import { WMSLayerModel } from '../models/wms-layer.model';
import { LayerTypesEnum } from '../models/layer-types.enum';
import { VectorLayerModel } from '../models/vector-layer.model';
import { XyzLayerModel } from '../models/xyz-layer.model';
import { WMTSLayerModel } from '../models/wmts-layer.model';
import { Tileset3DLayerModel } from '../models/tileset3D-layer.model';
import { ServiceLayerModel } from '../models/service-layer.model';
import { TerrainLayerModel } from '../models/terrain-layer.model';

export class LayerTypesHelper {

  public static isServiceLayer(layer: LayerModel): layer is ServiceLayerModel {
    return typeof (layer as ServiceLayerModel).url !== 'undefined';
  }

  public static isWmsLayer(layer: LayerModel): layer is WMSLayerModel {
    return layer.layerType === LayerTypesEnum.WMS;
  }

  public static isXyzLayer(layer: LayerModel): layer is XyzLayerModel {
    return layer.layerType === LayerTypesEnum.XYZ;
  }

  public static isVectorLayer(layer: LayerModel): layer is VectorLayerModel {
    return layer.layerType === LayerTypesEnum.Vector;
  }

  public static isWmtsLayer(layer: LayerModel): layer is WMTSLayerModel {
    return layer.layerType === LayerTypesEnum.WMTS;
  }

  public static isTileset3DLayer(layer: LayerModel): layer is Tileset3DLayerModel {
    return layer.layerType === LayerTypesEnum.TILESET3D;
  }

  public static isTerrainLayer(layer: LayerModel): layer is TerrainLayerModel {
    return layer.layerType === LayerTypesEnum.QUANTIZEDMESH;
  }

}
