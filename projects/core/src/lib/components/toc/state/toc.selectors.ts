import { TocState, tocStateKey } from './toc.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectLayersMap, selectLayerTree, selectOrderedLayerNodes } from '../../../map/state/map.selectors';
import { LayerTreeNodeHelper } from '../../../map/helpers/layer-tree-node.helper';
import { TreeModel } from '@tailormap-viewer/shared';

const selectTocState = createFeatureSelector<TocState>(tocStateKey);

export const selectFilterTerm = createSelector(selectTocState, state => state.filterTerm);

export const selectFilterEnabled = createSelector(selectTocState, state => state.filterEnabled);

export const selectInfoTreeNodeId = createSelector(selectTocState, state => state.infoTreeNodeId);

export const selectFilteredLayerTree = createSelector(
  selectFilterEnabled,
  selectFilterTerm,
  selectOrderedLayerNodes,
  selectLayersMap,
  selectLayerTree,
  (filterEnabled, filterTerm, layerTreeNodes, layers, layerTree): TreeModel[] => {
    if (!filterEnabled || !filterTerm) {
      return layerTree;
    }
    const filterRegexes: RegExp[] = filterTerm.trim().split(' ').map(f => new RegExp(f, 'i'));
    return layerTreeNodes
      .map(layerNode => LayerTreeNodeHelper.getTreeModelForLayerTreeNode(layerNode, layers))
      .filter(layerNode => filterRegexes.every(f => f.test(layerNode.label)));
  },
);
