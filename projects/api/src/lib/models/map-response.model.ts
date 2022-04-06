import { BoundsModel } from './bounds.model';
import { ServiceModel } from './service.model';
import { AppLayerModel } from './app-layer.model';
import { CoordinateReferenceSystemModel } from './coordinate-reference-system.model';
import { LayerTreeNodeModel } from './layer-tree-node.model';

export interface MapResponseModel {
  initialExtent: BoundsModel | null;
  maxExtent: BoundsModel | null;
  services: ServiceModel[];
  baseLayerTreeNodes: LayerTreeNodeModel[];
  layerTreeNodes: LayerTreeNodeModel[];
  appLayers: AppLayerModel[];
  crs: CoordinateReferenceSystemModel;
}
