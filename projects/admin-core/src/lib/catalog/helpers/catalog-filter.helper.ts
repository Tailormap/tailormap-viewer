import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { CatalogTreeHelper } from './catalog-tree.helper';
import { CatalogItemKindEnum } from '@tailormap-admin/admin-api';
import { join } from '@angular/compiler-cli';

interface NodeWithChildren {
  id: string;
  children: string[] | null;
}

export class CatalogFilterHelper {

  public static getFilteredTree(
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
    const filterRegexes: RegExp[] = filterTerm.trim().split(' ').map(f => new RegExp(f, 'i'));
    const layersMap = new Map(serviceLayers.map(l => [ l.id, l ]));
    const filteredLayers = CatalogFilterHelper.filter(
      filterRegexes,
      serviceLayers,
      l => [ l.name, l.title ].join(),
    );
    const filteredLayerSet = new Set(filteredLayers.map(l => l.id));
    const filteredLayerServices = new Set(filteredLayers.map(l => l.serviceId));
    const filteredFeatureTypes = CatalogFilterHelper.filter(filterRegexes, featureTypes, ft => ft.title);
    const filteredFeatureTypeSources = new Set(filteredFeatureTypes.map(l => l.featureSourceId));
    const filteredServices = services.filter(service => {
      return filteredLayerServices.has(service.id) || CatalogFilterHelper.testRegexes(filterRegexes, service.title);
    });
    const filteredServicesSet = new Set(filteredServices.map(l => l.id));
    const filteredFeatureSources = featureSources.filter(source => {
      return filteredFeatureTypeSources.has(source.id) || CatalogFilterHelper.testRegexes(filterRegexes, source.title);
    });
    const filteredFeatureSourcesSet = new Set(filteredFeatureSources.map(l => l.id));
    const filteredNodes = catalogNodes
      .map(node => ({
        ...node,
        items: node.items ? node.items.filter(item => {
          return item.kind === CatalogItemKindEnum.GEO_SERVICE && filteredServicesSet.has(item.id)
            ||  item.kind === CatalogItemKindEnum.FEATURE_SOURCE && filteredFeatureSourcesSet.has(item.id);
        }) : [],
      }))
      .filter(node => node.items.length > 0 || CatalogFilterHelper.testRegexes(filterRegexes, node.title));
    const filteredNodesSet = new Set(filteredNodes.map(n => n.id));
    const nodesMap = new Map(catalogNodes.map(c => [ c.id, c ]));
    const catalogTree = catalogNodes.filter(c => {
      return c.root || filteredNodesSet.has(c.id) || CatalogFilterHelper.hasFilteredChildren(c, nodesMap, filteredNodesSet);
    });
    const filteredLayersAndParents = serviceLayers.filter(l => {
      return filteredLayerSet.has(l.id) || CatalogFilterHelper.hasFilteredChildren(l, layersMap, filteredLayerSet);
    });
    const treeSize = (catalogTree.length - 1/*root level*/) + filteredServices.length + filteredLayersAndParents.length
      + filteredFeatureSources.length + filteredFeatureTypes.length;
    return CatalogTreeHelper.catalogToTree(
      catalogTree,
      filteredServices,
      filteredLayersAndParents,
      filteredFeatureSources,
      filteredFeatureTypes,
      treeSize <= 30,
    );
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

  private static filter<T>(filterRegexes: RegExp[], nodes: T[], getFilterableText: (node: T) => string) {
    return nodes.filter(node => CatalogFilterHelper.testRegexes(filterRegexes, getFilterableText(node)));
  }

  private static testRegexes(filterRegexes: RegExp[], text: string) {
    return filterRegexes.every(f => f.test(text));
  }

}
