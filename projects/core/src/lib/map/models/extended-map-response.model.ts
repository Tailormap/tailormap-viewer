import { MapResponseModel } from '@tailormap-viewer/api';
import { ExtendedLayerTreeNodeModel } from './extended-layer-tree-node.model';
import { AppLayerWithInitialValuesModel } from './extended-app-layer.model';

export interface ExtendedMapResponseModel extends MapResponseModel {
  appLayers: AppLayerWithInitialValuesModel[];
  layerTreeNodes: ExtendedLayerTreeNodeModel[];
}
