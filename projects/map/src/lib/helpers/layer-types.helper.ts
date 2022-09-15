import { LayerModel } from '../models/layer.model';
import { WMSLayerModel } from '../models/wms-layer.model';
import { LayerTypesEnum } from '../models/layer-types.enum';
import { VectorLayerModel } from '../models/vector-layer.model';
import { TMSLayerModel } from '../models/tms-layer.model';
import { WMTSLayerModel } from '../models/wmts-layer.model';

export class LayerTypesHelper {

  public static isWmsLayer(layer: LayerModel): layer is WMSLayerModel {
    return layer.layerType === LayerTypesEnum.WMS;
  }

  public static isTmsLayer(layer: LayerModel): layer is TMSLayerModel {
    return layer.layerType === LayerTypesEnum.TMS;
  }

  public static isVectorLayer(layer: LayerModel): layer is VectorLayerModel {
    return layer.layerType === LayerTypesEnum.Vector;
  }

  public static isWmtsLayer(layer: LayerModel): layer is WMTSLayerModel {
    return layer.layerType === LayerTypesEnum.WMTS;
  }

}
