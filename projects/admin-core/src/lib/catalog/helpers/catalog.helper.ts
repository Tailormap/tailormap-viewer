import { TreeHelper, TreeModel } from '@tailormap-viewer/shared';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { CatalogTreeModel } from '../models/catalog-tree.model';
import { CatalogItemKindEnum, CatalogItemModel, FeatureSourceModel } from '@tailormap-admin/admin-api';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';

export class CatalogHelper {

  public static catalogToTree(
    catalogNodes: ExtendedCatalogNodeModel[],
    services: ExtendedGeoServiceModel[],
    serviceLayers: ExtendedGeoServiceLayerModel[],
    featureSources: FeatureSourceModel[],
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
          children: [ ...children, ...CatalogHelper.getItems(node, services, serviceLayers, featureSources) ],
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
    featureSources: FeatureSourceModel[],
  ): CatalogTreeModel[] {
    const items: CatalogItemModel[] = node.items || [];
    const itemChildren: CatalogTreeModel[] = items.map(item => {
      if (item.kind === CatalogItemKindEnum.GEO_SERVICE) {
        return CatalogHelper.getTreeModelForService(services, layers, item.id);
      }
      if (item.kind === CatalogItemKindEnum.FEATURE_SOURCE) {
        return CatalogHelper.getTreeModelForFeatureSource(featureSources, item.id);
      }
      return null;
    }).filter((n): n is TreeModel => !!n);
    if (items.length > 0 && itemChildren.length === 0) {
      return [{ id: `placeholder-node-${node.id}`, label: 'Loading...', loadingPlaceholder: true }];
    }
    return itemChildren;
  }

  private static getTreeModelForCatalogNode(node: ExtendedCatalogNodeModel): CatalogTreeModel {
    return {
      id: `catalog-${node.id}`,
      label: node.title,
      type: CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE,
      metadata: node,
      checked: undefined,
      expanded: node.expanded,
    };
  }

  private static getTreeModelForFeatureSource(featureSources: FeatureSourceModel[], featureSourceId: string): CatalogTreeModel | null {
    const featureSource = featureSources.find(s => s.id === featureSourceId);
    if (!featureSource) {
      return null;
    }
    return {
      id: `feature-source-${featureSource.id}`,
      label: featureSource.title,
      type: CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE,
      metadata: featureSource,
      expandable: false,
    };
  }

  private static getTreeModelForService(services: ExtendedGeoServiceModel[], allLayers: ExtendedGeoServiceLayerModel[], serviceId: string): CatalogTreeModel | null {
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      return null;
    }
    const serviceLayers = service.layers || [];
    const serviceRootLayers = serviceLayers
      .map(id => allLayers.find(l => l.id === id) || null)
      .filter((l): l is ExtendedGeoServiceLayerModel => l !== null && l.root);
    return {
      id: `geo-service-${service.id}`,
      label: service.title,
      type: CatalogTreeModelTypeEnum.SERVICE_TYPE,
      checked: undefined,
      metadata: service,
      expanded: service.expanded,
      expandable: (service.layers || []).length > 0,
      children: serviceRootLayers.map(l => CatalogHelper.getTreeModelForLayer(l, allLayers)),
    };
  }

  private static getTreeModelForLayer(layer: ExtendedGeoServiceLayerModel, allLayers: ExtendedGeoServiceLayerModel[]): CatalogTreeModel {
    const layerChildren: CatalogTreeModel[] = (layer.children || [])
      .map(id => {
        const childLayer = allLayers.find(l => l.id === id && l.serviceId === layer.serviceId);
        if (!childLayer) {
          return null;
        }
        return CatalogHelper.getTreeModelForLayer(childLayer, allLayers);
      })
      .filter((l): l is TreeModel => !!l);
    return {
      id: `layer-${layer.id}`,
      label: layer.title,
      type: CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE,
      metadata: layer,
      checked: undefined,
      expanded: layer.expanded,
      expandable: layerChildren.length > 0,
      children: layerChildren.length > 0 ? layerChildren : undefined,
    };
  }

  public static isCatalogNode(node: CatalogTreeModel): node is TreeModel<ExtendedCatalogNodeModel> {
    return node.type === CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE;
  }

  public static isServiceNode(node: CatalogTreeModel): node is TreeModel<ExtendedGeoServiceModel> {
    return node.type === CatalogTreeModelTypeEnum.SERVICE_TYPE;
  }

  public static isLayerNode(node: CatalogTreeModel): node is TreeModel<ExtendedGeoServiceLayerModel> {
    return node.type === CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE;
  }

  public static isFeatureSource(node: CatalogTreeModel): node is TreeModel<FeatureSourceModel> {
    return node.type === CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE;
  }

  public static isExpandableNode(node: CatalogTreeModel): node is TreeModel<ExtendedGeoServiceModel> {
    return CatalogHelper.isCatalogNode(node) || CatalogHelper.isServiceNode(node) || CatalogHelper.isLayerNode(node);
  }

}
