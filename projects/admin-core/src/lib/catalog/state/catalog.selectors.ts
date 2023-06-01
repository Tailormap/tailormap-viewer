import { CatalogState, catalogStateKey } from './catalog.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CatalogTreeHelper } from '../helpers/catalog-tree.helper';
import { CatalogTreeModel } from '../models/catalog-tree.model';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { GeoServiceLayerSettingsModel } from '../models/geo-service-layer-settings.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { CatalogItemKindEnum } from '@tailormap-admin/admin-api';
import { ExtendedGeoServiceLayerWithSettingsModel } from '../models/extended-geo-service-layer-with-settings.model';

const selectCatalogState = createFeatureSelector<CatalogState>(catalogStateKey);

export const selectCatalog = createSelector(selectCatalogState, state => state.catalog);
export const selectGeoServices = createSelector(selectCatalogState, state => state.geoServices);
export const selectGeoServiceLayers = createSelector(selectCatalogState, state => state.geoServiceLayers);
export const selectFeatureSources = createSelector(selectCatalogState, state => state.featureSources);
export const selectFeatureTypes = createSelector(selectCatalogState, state => state.featureTypes);
export const selectCatalogLoadStatus = createSelector(selectCatalogState, state => state.catalogLoadStatus);
export const selectCatalogLoadError = createSelector(selectCatalogState, state => state.catalogLoadError);
export const selectFeatureSourceLoadStatus = createSelector(selectCatalogState, state => state.featureSourcesLoadStatus);

export const selectGeoServiceIds = createSelector(selectGeoServices, services => new Set(services.map(service => service.id)));
export const selectFeatureSourceIds = createSelector(selectFeatureSources, sources => new Set(sources.map(service => service.id)));

export const selectCatalogRootNodeId = createSelector(selectCatalog, catalog => {
  const rootNode = catalog.find(node => node.root);
  return rootNode ? rootNode.id : null;
});

export const selectGeoServicesWithoutCatalogId = createSelector(
  selectGeoServices,
  services => {
    return services.filter(service => !service.catalogNodeId).map(s => s.id);
  },
);

export const selectFeatureSourcesWithoutCatalogId = createSelector(
  selectFeatureSources,
  featureSources => {
    return featureSources.filter(featureSource => !featureSource.catalogNodeId).map(fs => fs.id);
  },
);

export const selectCatalogNodeById = (id: string) => createSelector(
  selectCatalog,
  (catalog): ExtendedCatalogNodeModel | null => catalog.find(node => node.id === id) || null,
);

export const selectGeoServiceById = (id: string) => createSelector(
  selectGeoServices,
  (services): ExtendedGeoServiceModel | null => services.find(service => service.id === id) || null,
);

export const selectFeatureSourceById = (id: string) => createSelector(
  selectFeatureSources,
  (sources): ExtendedFeatureSourceModel | null => sources.find(source => source.id === id) || null,
);

export const selectFeatureTypeById = (id: string) => createSelector(
  selectFeatureTypes,
  (featureTypes): ExtendedFeatureTypeModel | null => featureTypes.find(featureType => featureType.id === id) || null,
);

export const selectFeatureTypesForSource = (featureSourceId: string) => createSelector(
  selectFeatureTypes,
  (featureTypes): ExtendedFeatureTypeModel[] => featureTypes.filter(featureType => featureType.featureSourceId === featureSourceId),
);

export const selectGeoServiceAndLayerById = (serviceId: string, layerId: string) => createSelector(
  selectGeoServiceById(serviceId),
  selectGeoServiceLayers,
  (service, layers): { service: ExtendedGeoServiceModel; layer: ExtendedGeoServiceLayerModel } | null => {
    if (!service) {
      return null;
    }
    const layer = layers.find(l => l.id === layerId && l.serviceId === service.id);
    if (!layer) {
      return null;
    }
    return { service, layer };
  },
);

export const selectGeoServiceLayerSettingsById = (serviceId: string, layerId: string) => createSelector(
  selectGeoServiceAndLayerById(serviceId, layerId),
  (serviceAndLayer: { service: ExtendedGeoServiceModel; layer: ExtendedGeoServiceLayerModel } | null): GeoServiceLayerSettingsModel | null => {
    if (!serviceAndLayer) {
      return null;
    }
    const layerSettings = serviceAndLayer.service.settings?.layerSettings || {};
    return {
      layerName: serviceAndLayer.layer.name,
      layerTitle: serviceAndLayer.layer.title,
      serviceId: serviceAndLayer.service.id,
      protocol: serviceAndLayer.service.protocol,
      settings: layerSettings[serviceAndLayer.layer.name] || {},
    };
  },
);

export const selectParentsForCatalogNode = (id: string) => createSelector(
  selectCatalog,
  (catalog): string[] => {
    return CatalogTreeHelper.findParentsForNode(catalog, id);
  },
);

export const selectCatalogTree = createSelector(
  selectCatalog,
  selectGeoServices,
  selectGeoServiceLayers,
  selectFeatureSources,
  selectFeatureTypes,
  (catalog, services, layers, featureSources, featureTypes): CatalogTreeModel[] => {
    return CatalogTreeHelper.catalogToTree(catalog, services, layers, featureSources, featureTypes);
  },
);

export const selectServiceLayerTree = createSelector(
  selectCatalog,
  selectGeoServices,
  selectGeoServiceLayers,
  (catalog, services, layers): CatalogTreeModel[] => {
    const filteredNodes = catalog
      .map(node => ({
        ...node,
        items: node.items ? node.items.filter(item => item.kind ===  CatalogItemKindEnum.GEO_SERVICE) : node.items,
      }))
      .filter(node => {
        return (node.children || []).length > 0 || (node.items || []).length > 0;
      });
    return CatalogTreeHelper.catalogToTree(filteredNodes, services, layers, [], []);
  },
);

export const selectGeoServiceLayersWithSettingsApplied = createSelector(
  selectGeoServiceLayers,
  selectGeoServices,
  (layers, services): ExtendedGeoServiceLayerWithSettingsModel[] => {
    return layers.map((layer): ExtendedGeoServiceLayerWithSettingsModel => {
      const service = services.find(s => s.id === layer.serviceId);
      if (!service) {
        return layer;
      }
      const layerSettings = service.settings?.layerSettings || {};
      const settings = layerSettings[layer.name] || {};
      return {
        ...layer,
        settings,
      };
    });
  });

export const selectGeoServiceAndLayerByName = (serviceId: string, layerName: string) => createSelector(
  selectGeoServiceById(serviceId),
  selectGeoServiceLayers,
  (service, layers): { service: ExtendedGeoServiceModel; layer: ExtendedGeoServiceLayerModel } | null => {
    if (!service) {
      return null;
    }
    const layer = layers.find(l => l.name === layerName && l.serviceId === service.id);
    if (!layer) {
      return null;
    }
    return { service, layer };
  },
);
