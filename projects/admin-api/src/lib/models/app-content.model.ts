import { AppTreeNodeModel } from './app-tree-node.model';

export interface AppContentModel {
  baseLayerNodes: AppTreeNodeModel[];
  layerNodes: AppTreeNodeModel[];
  terrainLayerNodes: AppTreeNodeModel[];
}
