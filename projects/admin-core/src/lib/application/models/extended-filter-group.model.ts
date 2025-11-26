import { AttributeFilterModel, FilterGroupModel } from '@tailormap-viewer/api';
import { ExtendedAppTreeLayerNodeModel } from './extended-app-tree-layer-node.model';

export interface ExtendedFilterGroupModel {
  filterGroup: FilterGroupModel<AttributeFilterModel>;
  layers: ExtendedAppTreeLayerNodeModel[];
  isSelected: boolean;
}
