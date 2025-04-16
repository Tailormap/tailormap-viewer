import { AppLayerModel, LayerTreeNodeModel } from '@tailormap-viewer/api';

export interface LayerTreeNodeWithLayerModel extends LayerTreeNodeModel {
  layer?: AppLayerModel;
  is3dLayer: boolean;
}
