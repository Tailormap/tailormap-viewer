import { LayerModel } from './layer.model';
import { LayerTypesEnum } from './layer-types.enum';

export interface VectorLayerModel extends LayerModel {
  layerType: LayerTypesEnum.Vector;
  updateWhileAnimating?: boolean;
  /**
   * When true, the layer takes part in the layer order given to LayerManagerModel.setLayers (it is drawn between the service layers
   * at its position in that list) instead of staying on top of all service layers like drawing, highlight and measure layers.
   */
  followsLayerOrder?: boolean;
}
