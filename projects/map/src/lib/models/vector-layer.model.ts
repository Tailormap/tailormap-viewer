import { LayerModel } from './layer.model';
import { LayerTypesEnum } from './layer-types.enum';

export interface VectorLayerModel extends LayerModel {
  layerType: LayerTypesEnum.Vector;
  updateWhileAnimating?: boolean;
}
