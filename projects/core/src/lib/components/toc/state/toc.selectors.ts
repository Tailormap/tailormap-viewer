import { TocState, tocStateKey } from './toc.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectLayers, selectLayerTree, selectOrderedLayerNodes } from '../../../map/state/map.selectors';
import { LayerTreeNodeHelper } from '../../../map/helpers/layer-tree-node.helper';
import { TreeModel } from '@tailormap-viewer/shared';

const selectTocState = createFeatureSelector<TocState>(tocStateKey);

export const selectFilterTerm = createSelector(selectTocState, state => state.filterEnabled ? state.filterTerm : null);

export const selectFilterEnabled = createSelector(selectTocState, state => state.filterEnabled);

export const selectInfoTreeNodeId = createSelector(selectTocState, state => state.infoTreeNodeId);

export const selectFilteredLayerTree = createSelector(
  selectFilterTerm,
  selectOrderedLayerNodes,
  selectLayers,
  selectLayerTree,
  (filterTerm: string | null, layerTreeNodes, layers, layerTree): TreeModel[] => {
      if (filterTerm) {
        const filterRegexes: RegExp[] = filterTerm.trim().split(' ').map(f => new RegExp(f, 'i'));
        return layerTreeNodes
          .filter(layerNode => filterRegexes.every(f => f.test(layerNode.name)))
          .map(layerNode => LayerTreeNodeHelper.getTreeModelForLayerTreeNode(layerNode, layers));
      } else {
        return layerTree;
      }
  },
);
