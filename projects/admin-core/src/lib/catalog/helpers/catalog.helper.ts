import { TreeHelper, TreeModel } from '@tailormap-viewer/shared';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { CatalogTreeModel } from '../models/catalog-tree.model';
import { CatalogItemKindEnum, CatalogItemModel, FeatureSourceModel } from '@tailormap-admin/admin-api';

export class CatalogHelper {

  public static catalogToTree(
    catalogNodes: ExtendedCatalogNodeModel[],
    services: ExtendedGeoServiceModel[],
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
          children: [ ...children, ...CatalogHelper.getItems(node, services, featureSources) ],
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
    featureSources: FeatureSourceModel[],
  ): CatalogTreeModel[] {
    const items: CatalogItemModel[] = node.items || [];
    const itemChildren: CatalogTreeModel[] = items.map(item => {
      if (item.kind === CatalogItemKindEnum.GEO_SERVICE) {
        return CatalogHelper.getTreeModelForService(services, item.id);
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
      id: node.id,
      label: node.title,
      type: 'level',
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
      id: featureSource.id,
      label: featureSource.title,
      type: 'featureSource',
      metadata: featureSource,
      expandable: false,
    };
  }

  private static getTreeModelForService(services: ExtendedGeoServiceModel[], serviceId: string): CatalogTreeModel | null {
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      return null;
    }
    const serviceLayers = service.layers || [];
    const serviceRootLayers = serviceLayers.filter(l => l.root);
    return {
      id: service.id,
      label: service.title,
      type: 'service',
      checked: undefined,
      metadata: service,
      expanded: service.expanded,
      expandable: (service.layers || []).length > 0,
      children: serviceRootLayers.map(l => CatalogHelper.getTreeModelForLayer(l, serviceLayers)),
    };
  }

  private static getTreeModelForLayer(layer: ExtendedGeoServiceLayerModel, allLayers: ExtendedGeoServiceLayerModel[]): CatalogTreeModel {
    const layerChildren: CatalogTreeModel[] = (layer.children || [])
      .map(name => {
        const childLayer = allLayers.find(l => l.name === name);
        if (!childLayer) {
          return null;
        }
        return CatalogHelper.getTreeModelForLayer(childLayer, allLayers);
      })
      .filter((l): l is TreeModel => !!l);
    return {
      id: layer.name,
      label: layer.title,
      type: 'layer',
      metadata: layer,
      checked: undefined,
      expanded: layer.expanded,
      expandable: layerChildren.length > 0,
      children: layerChildren.length > 0 ? layerChildren : undefined,
    };
  }

}
