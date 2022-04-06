import { LayerTreeNodeModel } from '@tailormap-viewer/api';

export interface ExtendedLayerTreeNodeModel extends LayerTreeNodeModel {
  expanded?: boolean;
}
