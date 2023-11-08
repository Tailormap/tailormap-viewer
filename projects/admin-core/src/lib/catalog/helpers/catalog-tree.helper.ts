import { TreeHelper, TreeModel } from '@tailormap-viewer/shared';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { CatalogTreeModel } from '../models/catalog-tree.model';
import { CatalogItemKindEnum, CatalogItemModel, LayerSettingsModel } from '@tailormap-admin/admin-api';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { CatalogRouteHelper } from './catalog-route.helper';
import { Routes } from '../../routes';

export class CatalogTreeHelper {

  public static catalogToTree(
    catalogNodes: ExtendedCatalogNodeModel[],
    services: ExtendedGeoServiceModel[],
    serviceLayers: ExtendedGeoServiceLayerModel[],
    featureSources: ExtendedFeatureSourceModel[],
    featureTypes: ExtendedFeatureTypeModel[],
  ): CatalogTreeModel[] {
    const root = catalogNodes.find(l => l.root);
    if (!root) {
      return [];
    }
    const tree = TreeHelper.traverseTree<CatalogTreeModel, ExtendedCatalogNodeModel>(
      catalogNodes,
      root.id,
      (node, children) => {
        const nodeModel = CatalogTreeHelper.getTreeModelForCatalogNode(node);
        return {
          ...nodeModel,
          children: [ ...children, ...CatalogTreeHelper.getItems(node, services, serviceLayers, featureSources, featureTypes) ],
        };
      },
      (node) => node.children || [],
    );
    if (!tree) {
      return [];
    }
    // Skip root, start with children
    return tree.children || [];
  }

  private static getItems(
    node: ExtendedCatalogNodeModel,
    services: ExtendedGeoServiceModel[],
    layers: ExtendedGeoServiceLayerModel[],
    featureSources: ExtendedFeatureSourceModel[],
    featureTypes: ExtendedFeatureTypeModel[],
  ): CatalogTreeModel[] {
    const items: CatalogItemModel[] = node.items || [];
    const itemChildren: CatalogTreeModel[] = items.map(item => {
      if (item.kind === CatalogItemKindEnum.GEO_SERVICE) {
        return CatalogTreeHelper.getTreeModelForService(services, layers, item.id);
      }
      if (item.kind === CatalogItemKindEnum.FEATURE_SOURCE) {
        return CatalogTreeHelper.getTreeModelForFeatureSource(featureSources, featureTypes, item.id);
      }
      return null;
    }).filter((n): n is CatalogTreeModel => !!n);
    if (items.length > 0 && itemChildren.length === 0) {
      return [{ id: `placeholder-node-${node.id}`, label: 'Loading...', loadingPlaceholder: true }];
    }
    return itemChildren;
  }

  public static getTreeModelForCatalogNode(node: ExtendedCatalogNodeModel): CatalogTreeModel {
    return {
      id: CatalogTreeHelper.getIdForCatalogNode(node.id),
      label: node.title,
      type: CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE,
      metadata: node,
      checked: undefined,
      expanded: node.expanded,
      expandable: (node.children || []).length > 0 || (node.items || []).length > 0,
    };
  }

  public static getTreeModelForFeatureSource(
    featureSources: ExtendedFeatureSourceModel[],
    featureTypes: ExtendedFeatureTypeModel[],
    featureSourceId: string,
  ): CatalogTreeModel | null {
    const featureSource = featureSources.find(s => s.id === featureSourceId);
    if (!featureSource) {
      return null;
    }
    const featureTypeIds = featureSource.children || [];
    const sourceFeatureTypes = featureTypeIds
      .map(id => featureTypes.find(l => l.id === id) || null)
      .filter((l): l is ExtendedFeatureTypeModel => l !== null);
    return {
      id: CatalogTreeHelper.getIdForFeatureSourceNode(featureSource.id),
      label: featureSource.title,
      type: CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE,
      metadata: featureSource,
      expanded: featureSource.expanded,
      expandable: (featureSource.children || []).length > 0,
      children: sourceFeatureTypes.map(CatalogTreeHelper.getTreeModelForFeatureType),
    };
  }

  public static getTreeModelForFeatureType(featureType: ExtendedFeatureTypeModel): CatalogTreeModel {
    return {
      id: CatalogTreeHelper.getIdForFeatureTypeNode(featureType.id),
      label: featureType.title,
      type: CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE,
      metadata: featureType,
    };
  }

  public static getTreeModelForService(services: ExtendedGeoServiceModel[], allLayers: ExtendedGeoServiceLayerModel[], serviceId: string): CatalogTreeModel | null {
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      return null;
    }
    const serviceLayers = service.layers || [];
    const serviceRootLayers = serviceLayers
      .map(id => allLayers.find(l => l.id === id) || null)
      .filter((l): l is ExtendedGeoServiceLayerModel => l !== null && l.root);
    return {
      id: CatalogTreeHelper.getIdForServiceNode(service.id),
      label: service.title,
      type: CatalogTreeModelTypeEnum.SERVICE_TYPE,
      checked: undefined,
      metadata: service,
      expanded: service.expanded,
      expandable: (service.layers || []).length > 0,
      children: serviceRootLayers.map(l => CatalogTreeHelper.getTreeModelForLayer(l, allLayers, service.settings?.layerSettings)),
    };
  }

  public static getTreeModelForLayer(
    layer: ExtendedGeoServiceLayerModel,
    allLayers: ExtendedGeoServiceLayerModel[],
    layerSettings: Record<string, LayerSettingsModel> | undefined,
  ): CatalogTreeModel {
    const layerChildren: CatalogTreeModel[] = (layer.children || [])
      .map(id => {
        const childLayer = allLayers.find(l => l.id === id && l.serviceId === layer.serviceId);
        if (!childLayer) {
          return null;
        }
        return CatalogTreeHelper.getTreeModelForLayer(childLayer, allLayers, layerSettings);
      })
      .filter((l): l is CatalogTreeModel => !!l);
    const layerSettingTitle = layerSettings?.[layer.name]?.title;
    const title = layerSettingTitle || layer.title;
    return {
      id: CatalogTreeHelper.getIdForLayerNode(layer.id),
      label: title,
      type: CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE,
      metadata: layer,
      checked: undefined,
      expanded: layer.expanded,
      expandable: layerChildren.length > 0,
      children: layerChildren.length > 0 ? layerChildren : undefined,
    };
  }

  public static getIdForCatalogNode(id: string) {
    return `catalog-${id}`;
  }

  public static getIdForServiceNode(id: string) {
    return `service-${id}`;
  }

  public static getIdForLayerNode(id: string) {
    return `layer-${id}`;
  }

  public static getIdForFeatureSourceNode(id: string) {
    return `feature-source-${id}`;
  }

  public static getIdForFeatureTypeNode(id: string) {
    return `feature-type-${id}`;
  }

  public static isCatalogNode(node: CatalogTreeModel): node is TreeModel<ExtendedCatalogNodeModel, CatalogTreeModelTypeEnum> {
    return node.type === CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE;
  }

  public static isServiceNode(node: CatalogTreeModel): node is TreeModel<ExtendedGeoServiceModel, CatalogTreeModelTypeEnum> {
    return node.type === CatalogTreeModelTypeEnum.SERVICE_TYPE;
  }

  public static isLayerNode(node: CatalogTreeModel): node is TreeModel<ExtendedGeoServiceLayerModel, CatalogTreeModelTypeEnum> {
    return node.type === CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE;
  }

  public static isFeatureSource(node: CatalogTreeModel): node is TreeModel<ExtendedFeatureSourceModel, CatalogTreeModelTypeEnum> {
    return node.type === CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE;
  }

  public static isFeatureType(node: CatalogTreeModel): node is TreeModel<ExtendedFeatureTypeModel, CatalogTreeModelTypeEnum> {
    return node.type === CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE;
  }

  public static isExpandableNode(node: CatalogTreeModel): node is CatalogTreeModel {
    return CatalogTreeHelper.isCatalogNode(node)
      || CatalogTreeHelper.isServiceNode(node)
      || CatalogTreeHelper.isLayerNode(node)
      || CatalogTreeHelper.isFeatureSource(node);
  }

  public static findParentsForNode(list: Array<{ id: string; children?: string[] | null }>, nodeId: string): string[] {
    const findParents = (id: string): string[] => {
      const parents = (list || []).filter(n => n.children?.includes(id));
      return parents.reduce<string[]>((acc, parent) => [ ...acc, parent.id, ...findParents(parent.id) ], []);
    };
    return findParents(nodeId);
  }

  public static isNodeWithRoute(node: CatalogTreeModel | null) {
    if (!node || !node.type) {
      return false;
    }
    const allowedNodes = [
      CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE,
      CatalogTreeModelTypeEnum.SERVICE_TYPE,
      CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE,
      CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE,
    ];
    return allowedNodes.includes(node.type) || (CatalogTreeHelper.isLayerNode(node) && !node?.metadata?.virtual);
  }

  public static getRouterLink(node: CatalogTreeModel | null) {
    if (!node || !node.metadata || !CatalogTreeHelper.isNodeWithRoute(node)) {
      return null;
    }
    if (CatalogTreeHelper.isCatalogNode(node)) {
      return CatalogRouteHelper.getCatalogNodeUrl(node.metadata);
    }
    if (CatalogTreeHelper.isServiceNode(node)) {
      return CatalogRouteHelper.getGeoServiceUrl(node.metadata);
    }
    if (CatalogTreeHelper.isLayerNode(node)) {
      return CatalogRouteHelper.getGeoServiceLayerUrl(node.metadata);
    }
    if (CatalogTreeHelper.isFeatureSource(node)) {
      return CatalogRouteHelper.getFeatureSourceUrl(node.metadata);
    }
    if (CatalogTreeHelper.isFeatureType(node)) {
      return CatalogRouteHelper.getFeatureTypeUrl(node.metadata);
    }
    return null;
  }

  public static readNodesFromUrl(url: string | null): Array<{ type: CatalogTreeModelTypeEnum; treeNodeId: string; id: string }> {
    if (url === null) {
      return [];
    }
    const currentRoute = url
      .substring(url.indexOf('/admin') === 0 ? 6 : 0) // remove /admin from URL if url starts with /admin
      .replace(Routes.CATALOG, '')
      .split('/')
      .filter(part => !!part);
    const parts: Array<{ type: CatalogTreeModelTypeEnum; treeNodeId: string; id: string }> = [];
    if (currentRoute.length >= 2 && currentRoute[0] === 'node') {
      parts.push({ type: CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE, treeNodeId: CatalogTreeHelper.getIdForCatalogNode(currentRoute[1]), id: currentRoute[1] });
    }
    if (currentRoute.length >= 4 && currentRoute[2] === 'service') {
      parts.push({ type: CatalogTreeModelTypeEnum.SERVICE_TYPE, treeNodeId: CatalogTreeHelper.getIdForServiceNode(currentRoute[3]), id: currentRoute[3] });
    }
    if (currentRoute.length >= 4 && currentRoute[2] === 'feature-source') {
      parts.push({ type: CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE, treeNodeId: CatalogTreeHelper.getIdForFeatureSourceNode(currentRoute[3]), id: currentRoute[3] });
    }
    if (currentRoute.length >= 6 && currentRoute[4] === 'feature-type') {
      parts.push({ type: CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE, treeNodeId: CatalogTreeHelper.getIdForFeatureTypeNode(currentRoute[5]), id: currentRoute[5] });
    }
    if (currentRoute.length >= 6 && currentRoute[4] === 'layer') {
      parts.push({ type: CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE, treeNodeId: CatalogTreeHelper.getIdForLayerNode(currentRoute[5]), id: currentRoute[5] });
    }
    return parts;
  }

}
