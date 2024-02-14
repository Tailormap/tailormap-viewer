import { TreeHelper, TreeModel } from '@tailormap-viewer/shared';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { CatalogTreeModel } from '../models/catalog-tree.model';
import { CatalogItemKindEnum, CatalogItemModel } from '@tailormap-admin/admin-api';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { CatalogRouteHelper } from './catalog-route.helper';
import { Routes } from '../../routes';

export class CatalogTreeHelper {

  public static CONNECTED_ITEM_CLASS = 'connected-item';

  public static catalogToTree(
    catalogNodes: ExtendedCatalogNodeModel[],
    services: ExtendedGeoServiceModel[],
    serviceLayers: ExtendedGeoServiceLayerModel[],
    featureSources: ExtendedFeatureSourceModel[],
    featureTypes: ExtendedFeatureTypeModel[],
    forceExpandAll = false,
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
          expanded: forceExpandAll || nodeModel.expanded,
          children: [ ...children, ...CatalogTreeHelper.getItems(node, services, serviceLayers, featureSources, featureTypes, forceExpandAll) ],
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
    forceExpandAll: boolean,
  ): CatalogTreeModel[] {
    const items: CatalogItemModel[] = node.items || [];
    const servicesMap = new Map(services.map(s => [ s.id, s ]));
    const serviceLayersMap = new Map(layers.map(s => [ s.id, s ]));
    const featureSourcesMap = new Map(featureSources.map(s => [ s.id, s ]));
    const featureTypesMap = new Map(featureTypes.map(s => [ s.id, s ]));
    const featureSourcesAndTypes = new Set(featureTypes.map(s => {
      return CatalogTreeHelper.getFeatureSourceTypeKey(s.featureSourceId, s.name);
    }));
    const connectedFeatureTypes = new Set(layers.map(l => {
      if (l.layerSettings?.featureType) {
        const key = CatalogTreeHelper.getFeatureSourceTypeKey(l.layerSettings.featureType.featureSourceId, l.layerSettings.featureType.featureTypeName);
        if (key && featureSourcesAndTypes.has(key)) {
          return key;
        }
      }
      return '';
    }).filter(s => s !== ''));
    return items.map(item => {
      if (item.kind === CatalogItemKindEnum.GEO_SERVICE) {
        return CatalogTreeHelper.getTreeModelForService(servicesMap, serviceLayersMap, connectedFeatureTypes, item.id, forceExpandAll);
      }
      if (item.kind === CatalogItemKindEnum.FEATURE_SOURCE) {
        return CatalogTreeHelper.getTreeModelForFeatureSource(featureSourcesMap, featureTypesMap, connectedFeatureTypes, item.id, forceExpandAll);
      }
      return null;
    }).filter((n): n is CatalogTreeModel => !!n);
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
    featureSources: Map<string, ExtendedFeatureSourceModel>,
    featureTypes: Map<string, ExtendedFeatureTypeModel>,
    connectedFeatureTypes: Set<string>,
    featureSourceId: string,
    forceExpandAll: boolean,
  ): CatalogTreeModel | null {
    const featureSource = featureSources.get(featureSourceId);
    if (!featureSource) {
      return null;
    }
    const featureTypeIds = featureSource.featureTypesIds || [];
    const sourceFeatureTypes = featureTypeIds
      .map(id => featureTypes.get(id) || null)
      .filter((l): l is ExtendedFeatureTypeModel => l !== null);
    let hasConnectedChildren = false;
    const featureTypeChildren = sourceFeatureTypes.map(ft => {
      const isConnected = connectedFeatureTypes.has(CatalogTreeHelper.getFeatureSourceTypeKey(ft.featureSourceId, ft.name));
      if (isConnected) {
        hasConnectedChildren = true;
      }
      return CatalogTreeHelper.getTreeModelForFeatureType(ft, isConnected);
    });
    return {
      id: CatalogTreeHelper.getIdForFeatureSourceNode(featureSource.id),
      label: featureSource.title,
      type: CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE,
      metadata: featureSource,
      expanded: forceExpandAll || featureSource.expanded,
      expandable: (featureSource.featureTypesIds || []).length > 0,
      children: featureTypeChildren,
      className: hasConnectedChildren ? CatalogTreeHelper.CONNECTED_ITEM_CLASS : '',
    };
  }

  public static getTreeModelForFeatureType(featureType: ExtendedFeatureTypeModel, isConnected: boolean): CatalogTreeModel {
    return {
      id: CatalogTreeHelper.getIdForFeatureTypeNode(featureType.id),
      label: featureType.title,
      type: CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE,
      metadata: featureType,
      className: isConnected ? CatalogTreeHelper.CONNECTED_ITEM_CLASS : '',
    };
  }

  public static getTreeModelForService(
    services: Map<string, ExtendedGeoServiceModel>,
    allLayers: Map<string, ExtendedGeoServiceLayerModel>,
    connectedFeatureTypes: Set<string>,
    serviceId: string,
    forceExpandAll: boolean,
  ): CatalogTreeModel | null {
    const service = services.get(serviceId);
    if (!service) {
      return null;
    }
    const serviceLayers = service.layerIds || [];
    const serviceRootLayers = serviceLayers
      .map(id => allLayers.get(id) || null)
      .filter((l): l is ExtendedGeoServiceLayerModel => l !== null && l.root);
    const layerChildren = serviceRootLayers.map(l => {
      return CatalogTreeHelper.getTreeModelForLayer(l, allLayers, connectedFeatureTypes, forceExpandAll);
    });
    return {
      id: CatalogTreeHelper.getIdForServiceNode(service.id),
      label: service.title,
      type: CatalogTreeModelTypeEnum.SERVICE_TYPE,
      checked: undefined,
      metadata: service,
      expanded: forceExpandAll || service.expanded,
      expandable: (service.layerIds || []).length > 0,
      children: layerChildren,
    };
  }

  public static getTreeModelForLayer(
    layer: ExtendedGeoServiceLayerModel,
    allLayers: Map<string, ExtendedGeoServiceLayerModel>,
    connectedFeatureTypes: Set<string>,
    forceExpandAll: boolean,
  ): CatalogTreeModel {
    const layerChildren: CatalogTreeModel[] = (layer.children || [])
      .map(id => {
        const childLayer = allLayers.get(id);
        if (!childLayer) {
          return null;
        }
        return CatalogTreeHelper.getTreeModelForLayer(childLayer, allLayers, connectedFeatureTypes, forceExpandAll);
      })
      .filter((l): l is CatalogTreeModel => !!l);
    const title = layer.layerSettings?.title || layer.title;
    const featureSourceKey = CatalogTreeHelper.getFeatureSourceTypeKey(layer.layerSettings?.featureType?.featureSourceId, layer.layerSettings?.featureType?.featureTypeName);
    const hasConnectedFeatureSource = featureSourceKey && connectedFeatureTypes.has(featureSourceKey);
    const className = hasConnectedFeatureSource ? CatalogTreeHelper.CONNECTED_ITEM_CLASS : '';
    return {
      id: CatalogTreeHelper.getIdForLayerNode(layer.id),
      label: title,
      type: CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE,
      metadata: layer,
      checked: undefined,
      expanded: forceExpandAll || layer.expanded,
      expandable: layerChildren.length > 0,
      children: layerChildren.length > 0 ? layerChildren : undefined,
      className,
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

  private static getFeatureSourceTypeKey(featureSourceId?: string | number, featureTypeName?: string) {
    if (typeof featureSourceId === "undefined" || typeof featureTypeName === "undefined") {
      return '';
    }
    return `${featureSourceId}_${featureTypeName}`;
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

  public static readNodeFromUrl(url: string | null): { type: CatalogTreeModelTypeEnum; treeNodeId: string; id: string } | null {
    if (url === null) {
      return null;
    }
    const currentRoute = url
      .substring(url.indexOf('/admin') === 0 ? 6 : 0) // remove /admin from URL if url starts with /admin
      .replace(Routes.CATALOG, '')
      .split('/')
      .filter(part => !!part);
    if (currentRoute.length < 2) {
      return null;
    }
    const nodeType = currentRoute[0];
    const nodeId = currentRoute[1];
    if (nodeType === 'node') {
      return { type: CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE, treeNodeId: CatalogTreeHelper.getIdForCatalogNode(nodeId), id: nodeId };
    }
    if (nodeType === 'service') {
      return { type: CatalogTreeModelTypeEnum.SERVICE_TYPE, treeNodeId: CatalogTreeHelper.getIdForServiceNode(nodeId), id: nodeId };
    }
    if (nodeType === 'feature-source') {
      return { type: CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE, treeNodeId: CatalogTreeHelper.getIdForFeatureSourceNode(nodeId), id: nodeId };
    }
    if (nodeType === 'feature-type') {
      return { type: CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE, treeNodeId: CatalogTreeHelper.getIdForFeatureTypeNode(nodeId), id: nodeId };
    }
    if (nodeType === 'layer') {
      return { type: CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE, treeNodeId: CatalogTreeHelper.getIdForLayerNode(nodeId), id: nodeId };
    }
    return null;
  }

}
