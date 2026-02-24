import { MapResponseModel } from '@tailormap-viewer/api';
import { ExtendedLayerTreeNodeModel } from './extended-layer-tree-node.model';
import { AppLayerStateModel } from './extended-app-layer.model';

export interface ExtendedMapResponseModel extends MapResponseModel {
  appLayers: AppLayerStateModel[];
  layerTreeNodes: ExtendedLayerTreeNodeModel[];
}
