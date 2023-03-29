import { TreeHelper, TreeModel } from '@tailormap-viewer/shared';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { CatalogTreeModel } from '../models/catalog-tree.model';
import { CatalogItemKindEnum, CatalogItemModel } from '@tailormap-admin/admin-api';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { RoutesEnum } from '../../routes';

export class CatalogHelper {

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
        const nodeModel = CatalogHelper.getTreeModelForCatalogNode(node);
        return {
          ...nodeModel,
          children: [ ...children, ...CatalogHelper.getItems(node, services, serviceLayers, featureSources, featureTypes) ],
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
        return CatalogHelper.getTreeModelForService(services, layers, item.id);
      }
      if (item.kind === CatalogItemKindEnum.FEATURE_SOURCE) {
        return CatalogHelper.getTreeModelForFeatureSource(featureSources, featureTypes, item.id);
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
      id: CatalogHelper.getIdForCatalogNode(node.id),
      label: node.title,
      type: CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE,
      metadata: node,
      checked: undefined,
      expanded: node.expanded,
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
      id: CatalogHelper.getIdForFeatureSourceNode(featureSource.id),
      label: featureSource.title,
      type: CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE,
      metadata: featureSource,
      expanded: featureSource.expanded,
      expandable: (featureSource.children || []).length > 0,
      children: sourceFeatureTypes.map(CatalogHelper.getTreeModelForFeatureType),
    };
  }

  public static getTreeModelForFeatureType(featureType: ExtendedFeatureTypeModel): CatalogTreeModel {
    return {
      id: CatalogHelper.getIdForFeatureTypeNode(featureType.id),
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
      id: CatalogHelper.getIdForServiceNode(service.id),
      label: service.title,
      type: CatalogTreeModelTypeEnum.SERVICE_TYPE,
      checked: undefined,
      metadata: service,
      expanded: service.expanded,
      expandable: (service.layers || []).length > 0,
      children: serviceRootLayers.map(l => CatalogHelper.getTreeModelForLayer(l, allLayers)),
    };
  }

  public static getTreeModelForLayer(layer: ExtendedGeoServiceLayerModel, allLayers: ExtendedGeoServiceLayerModel[]): CatalogTreeModel {
    const layerChildren: CatalogTreeModel[] = (layer.children || [])
      .map(id => {
        const childLayer = allLayers.find(l => l.id === id && l.serviceId === layer.serviceId);
        if (!childLayer) {
          return null;
        }
        return CatalogHelper.getTreeModelForLayer(childLayer, allLayers);
      })
      .filter((l): l is CatalogTreeModel => !!l);
    return {
      id: CatalogHelper.getIdForLayerNode(layer.id),
      label: layer.title,
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
    return CatalogHelper.isCatalogNode(node) || CatalogHelper.isServiceNode(node) || CatalogHelper.isLayerNode(node);
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
    return allowedNodes.includes(node.type) || (CatalogHelper.isLayerNode(node) && !node?.metadata?.virtual);
  }

  public static getRouterLink(node: CatalogTreeModel | null) {
    if (!node || !node.metadata || !CatalogHelper.isNodeWithRoute(node)) {
      return null;
    }
    if (CatalogHelper.isCatalogNode(node)) {
      return CatalogHelper.getUrl(RoutesEnum.CATALOG_NODE_DETAILS, [[ ':nodeId', node.metadata.id ]]);
    }
    if (CatalogHelper.isServiceNode(node)) {
      return CatalogHelper.getUrl(RoutesEnum.CATALOG_SERVICE_DETAILS, [
        [ ':nodeId', node.metadata.catalogNodeId ],
        [ ':serviceId', node.metadata.id ],
      ]);
    }
    if (CatalogHelper.isLayerNode(node)) {
      return CatalogHelper.getUrl(RoutesEnum.CATALOG_LAYER_DETAILS, [
        [ ':nodeId',  node.metadata.catalogNodeId ],
        [ ':serviceId',  node.metadata.serviceId ],
        [ ':layerId',  node.metadata.id ],
      ]);
    }
    if (CatalogHelper.isFeatureSource(node)) {
      return CatalogHelper.getUrl(RoutesEnum.FEATURE_SOURCE_DETAILS, [
        [ ':nodeId', node.metadata.catalogNodeId ],
        [ ':featureSourceId', node.metadata.id ],
      ]);
    }
    if (CatalogHelper.isFeatureType(node)) {
      return CatalogHelper.getUrl(RoutesEnum.FEATURE_TYPE_DETAILS, [
        [ ':nodeId', node.metadata.catalogNodeId ],
        [ ':featureSourceId', node.metadata.featureSourceId ],
        [ ':featureTypeId', node.metadata.id ],
      ]);
    }
    return null;
  }

  private static getUrl(baseUrl: string, replacements: Array<[string, string]>) {
    const nodeUrl = replacements.reduce<string>((url, [ key, replacement ]) => url.replace(key, replacement), baseUrl);
    return [ '', RoutesEnum.CATALOG, nodeUrl ].join('/');
  }

}
