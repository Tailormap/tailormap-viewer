import { FilterHelper, TreeHelper, TreeModel } from '@tailormap-viewer/shared';
import { AppLayerSettingsModel, AppTreeLayerNodeModel, AppTreeLevelNodeModel, AppTreeNodeModel } from '@tailormap-admin/admin-api';
import { ApplicationModelHelper } from './application-model.helper';
import { ApplicationService } from '../services/application.service';
import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';

export class ApplicationTreeHelper {

  public static isLevelTreeNode(node?: TreeModel<AppTreeNodeModel> | null): node is TreeModel<AppTreeLevelNodeModel> {
    return !!(node && node.metadata && ApplicationModelHelper.isLevelTreeNode(node.metadata));
  }

  public static isLayerTreeNode(node?: TreeModel<AppTreeNodeModel> | null): node is TreeModel<AppTreeLayerNodeModel> {
    return !!(node && node.metadata && ApplicationModelHelper.isLayerTreeNode(node.metadata));
  }

  public static layerTreeNodeToTree(
    layerTreeNodes: AppTreeNodeModel[],
    layers: ExtendedGeoServiceLayerModel[],
    expandedNodes: string[],
    layerSettings: Record<string, AppLayerSettingsModel> | null,
    treeKey?: 'layer' | 'baseLayer' | 'terrainLayer',
    filterTerm?: string,
  ): TreeModel<AppTreeNodeModel>[] {
    const layersMap = ApplicationTreeHelper.getLayerMap(layers);
    const root = layerTreeNodes.find(l => ApplicationModelHelper.isLevelTreeNode(l) && l.root);
    if (!root) {
      return [];
    }
    const filteredLayerTreeNodes = ApplicationTreeHelper.getFilteredLayerTreeNodes(layerTreeNodes, root, layersMap, layerSettings, treeKey, filterTerm);
    const tree = TreeHelper.traverseTree<TreeModel<AppTreeNodeModel>, AppTreeNodeModel>(
      filteredLayerTreeNodes,
      root.id,
      (node, children) => ({
        ...ApplicationTreeHelper.getTreeModelForLayerTreeNode(node, layersMap, expandedNodes, layerSettings, treeKey),
        children,
      }),
      node => ApplicationModelHelper.isLevelTreeNode(node) ? node.childrenIds : [],
    );
    if (!tree) {
      return [];
    }
    // Skip root, start with children
    return [tree];
  }

  public static getFilteredLayerTreeNodes(
    layerTreeNodes: AppTreeNodeModel[],
    root: AppTreeNodeModel,
    layersMap: Map<string, ExtendedGeoServiceLayerModel>,
    layerSettings: Record<string, AppLayerSettingsModel> | null,
    treeKey?: 'layer' | 'baseLayer' | 'terrainLayer',
    filterTerm?: string,
  ) {
    if (filterTerm) {
      const filterTerms = FilterHelper.createFilterTerms(filterTerm);
      // Get layers matching filter
      const filteredLayers = layerTreeNodes.filter(node => {
        if (!ApplicationModelHelper.isLayerTreeNode(node)) {
          return false;
        }
        const label = ApplicationTreeHelper.getTreeModelLabel(node, layersMap, layerSettings, treeKey);
        return FilterHelper.matchesFilterTerm(filterTerms, label);
      });
      const filteredLayerIds = new Set(filteredLayers.map(n => n.id));
      // Get filtered levels nodes
      const levelNodes = layerTreeNodes.filter(ApplicationModelHelper.isLevelTreeNode);
      const filteredLevelNodes = levelNodes.filter(node => {
        return FilterHelper.matchesFilterTerm(filterTerms, node.title) || node.childrenIds.some(id => filteredLayerIds.has(id));
      });
      const filteredLevels = FilterHelper.getFilteredItemsAndParents(levelNodes, filteredLevelNodes, node => node.childrenIds);
      if (filteredLevels.length === 0 && filteredLayers.length === 0) {
        return [];
      }
      return [
        root,
        ...filteredLevels,
        ...filteredLayers,
      ];
    }
    return layerTreeNodes;
  }

  public static getTreeModelForLayerTreeNode(
    node: AppTreeNodeModel,
    layers: Map<string, ExtendedGeoServiceLayerModel>,
    expandedNodes: string[],
    layerSettings: Record<string, AppLayerSettingsModel> | null,
    treeKey?: 'layer' | 'baseLayer' | 'terrainLayer',
  ): TreeModel<AppTreeNodeModel> {
    return {
      id: node.id,
      label: ApplicationTreeHelper.getTreeModelLabel(node, layers, layerSettings, treeKey),
      type: ApplicationModelHelper.isLayerTreeNode(node) ? 'layer' : 'level',
      metadata: node,
      checked: ApplicationModelHelper.isLayerTreeNode(node)
        ? node.visible
        : true, // must be boolean but for levels this is determined by the checked status of the layers inside
      expanded: expandedNodes.includes(node.id) || (ApplicationModelHelper.isLevelTreeNode(node) && node.root),
      expandable: ApplicationModelHelper.isLevelTreeNode(node),
    };
  }

  public static getLayerMap(layers: ExtendedGeoServiceLayerModel[]) {
    return new Map(layers.map((l) => {
      return [ ApplicationTreeHelper.getLayerMapKey(l.name, l.serviceId), l ];
    }));
  }

  public static getLayerMapKey(layerName: string, serviceId: string | number) {
    return `${layerName}_${serviceId}`;
  }

  public static getTreeModelLabel(
    node: AppTreeNodeModel,
    layers: Map<string, ExtendedGeoServiceLayerModel>,
    layerSettings: Record<string, AppLayerSettingsModel> | null,
    treeKey?: 'layer' | 'baseLayer' | 'terrainLayer',
  ) {
    const layer = ApplicationModelHelper.isLayerTreeNode(node)
      ? layers.get(ApplicationTreeHelper.getLayerMapKey(node.layerName, node.serviceId))
      : null;
    if (ApplicationModelHelper.isLevelTreeNode(node)) {
      return node.root
        ? (treeKey === 'layer' ? ApplicationService.ROOT_NODE_TITLE
            : (treeKey === 'baseLayer' ? ApplicationService.ROOT_BASE_NODE_TITLE
            : ApplicationService.ROOT_TERRAIN_NODE_TITLE))
        : node.title;
    }
    if (ApplicationModelHelper.isLayerTreeNode(node)) {
      const layerSettingTitle = layerSettings?.[node.id]?.title;
      return layerSettingTitle || layer?.layerSettings?.title || layer?.title || node.layerName;
    }
    return '';
  }

}
