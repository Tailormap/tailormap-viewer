import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { CatalogTreeHelper } from './catalog-tree.helper';
import { CatalogItemKindEnum } from '@tailormap-admin/admin-api';
import { CatalogExtendedModel } from '../models/catalog-extended.model';
import { ExtendedCatalogModelHelper } from './extended-catalog-model.helper';

interface NodeWithChildren {
  id: string;
  children: string[] | null;
}

export class CatalogFilterHelper {

  public static filterTreeByFilterTerm(
    catalogNodes: ExtendedCatalogNodeModel[],
    services: ExtendedGeoServiceModel[],
    serviceLayers: ExtendedGeoServiceLayerModel[],
    featureSources: ExtendedFeatureSourceModel[],
    featureTypes: ExtendedFeatureTypeModel[],
    filterTerm: string | undefined,
  ) {
    if (!filterTerm) {
      return CatalogTreeHelper.catalogToTree(catalogNodes, services, serviceLayers, featureSources, featureTypes);
    }
    // Create regexes to filter
    const filterRegexes = CatalogFilterHelper.createFilterRegexes(filterTerm);
    return CatalogFilterHelper.getFilteredTree(catalogNodes, services, serviceLayers, featureSources, featureTypes, item => {
      if (ExtendedCatalogModelHelper.isGeoServiceLayerModel(item)) {
        const title = item.layerSettings?.title || item.title;
        return CatalogFilterHelper.testRegexes(filterRegexes, title);
      }
      return CatalogFilterHelper.testRegexes(filterRegexes, item.title);
    });
  }

  private static getFilteredTree(
    catalogNodes: ExtendedCatalogNodeModel[],
    services: ExtendedGeoServiceModel[],
    serviceLayers: ExtendedGeoServiceLayerModel[],
    featureSources: ExtendedFeatureSourceModel[],
    featureTypes: ExtendedFeatureTypeModel[],
    filterMethod: (item: CatalogExtendedModel) => boolean,
  ) {
    const root = catalogNodes.find(c => c.root);
    if (!root) {
      return [];
    }
    // Filter layers
    const filteredLayers = serviceLayers.filter(filterMethod);
    // Filter services, containing one of the filtered layers or matching the filter itself
    const filteredLayerServices = new Set(filteredLayers.map(l => l.serviceId));
    const filteredServices = services.filter(service => {
      return filteredLayerServices.has(service.id) || filterMethod(service);
    });
    // Filter feature types
    const filteredFeatureTypes = featureTypes.filter(filterMethod);
    // Filter feature sources, containing one of the filtered feature types or matching the filter itself
    const filteredFeatureTypeSources = new Set(filteredFeatureTypes.map(l => l.featureSourceId));
    const filteredFeatureSources = featureSources.filter(source => {
      return filteredFeatureTypeSources.has(source.id) || filterMethod(source);
    });
    // Remove all items from catalog nodes of services and feature sources that are not matched by filters
    const filteredServicesSet = new Set(filteredServices.map(l => l.id));
    const filteredFeatureSourcesSet = new Set(filteredFeatureSources.map(l => l.id));
    const filteredNodes = catalogNodes
      .map(node => ({
        ...node,
        items: node.items ? node.items.filter(item => {
          return item.kind === CatalogItemKindEnum.GEO_SERVICE && filteredServicesSet.has(item.id)
            ||  item.kind === CatalogItemKindEnum.FEATURE_SOURCE && filteredFeatureSourcesSet.has(item.id);
        }) : [],
      }))
      // Keep only nodes with items or nodes matching the filter itself
      .filter(node => node.items.length > 0 || filterMethod(node));
    // Get list of catalog nodes including also parents of matching catalog nodes
    const catalogTree = [
      root,
      ...CatalogFilterHelper.getFilteredItemsAndParents(catalogNodes, filteredNodes),
    ];
    // Get list layers including also the parents of matching layers
    const filteredLayersAndParents = CatalogFilterHelper.getFilteredItemsAndParents(serviceLayers, filteredLayers);
    // Get the size of the tree, so we can decide whether to expand all the items
    const treeSize = (catalogTree.length - 1/*root level*/) + filteredServices.length + filteredLayersAndParents.length
      + filteredFeatureSources.length + filteredFeatureTypes.length;
    // Return tree
    return CatalogTreeHelper.catalogToTree(
      catalogTree,
      filteredServices,
      filteredLayersAndParents,
      filteredFeatureSources,
      filteredFeatureTypes,
      treeSize <= 30,
    );
  }

  private static testRegexes(filterRegexes: RegExp[], text: string) {
    return filterRegexes.every(f => f.test(text));
  }

  private static createFilterRegexes(filterTerm: string): RegExp[] {
    return filterTerm.trim().split(' ').map(f => new RegExp(f, 'i'));
  }

  private static getFilteredItemsAndParents<T extends NodeWithChildren>(allItems: T[], filteredItems: T[]): T[] {
    const filteredItemsSet = new Set(filteredItems.map(l => l.id));
    const allItemsMap = new Map(allItems.map(l => [ l.id, l ]));
    return allItems.filter(l => {
      return filteredItemsSet.has(l.id) || CatalogFilterHelper.hasFilteredChildren(l, allItemsMap, filteredItemsSet);
    });
  }

  private static hasFilteredChildren(node: NodeWithChildren, allNodes: Map<string, NodeWithChildren>, filteredNodes: Set<string>): boolean {
    if (!node.children) {
      return false;
    }
    return node.children.some(c => {
      const child = allNodes.get(c);
      if (child && filteredNodes.has(child.id)) {
        return true;
      }
      if (child && child.children) {
        return CatalogFilterHelper.hasFilteredChildren(child, allNodes, filteredNodes);
      }
      return false;
    });
  }

}
