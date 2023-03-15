import { CatalogState, catalogStateKey } from './catalog.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CatalogHelper } from '../helpers/catalog.helper';
import { CatalogTreeModel } from '../models/catalog-tree.model';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { GeoServiceLayerSettingsModel } from '../models/geo-service-layer-settings.model';

const selectCatalogState = createFeatureSelector<CatalogState>(catalogStateKey);

export const selectCatalog = createSelector(selectCatalogState, state => state.catalog);
export const selectGeoServices = createSelector(selectCatalogState, state => state.geoServices);
export const selectGeoServiceLayers = createSelector(selectCatalogState, state => state.geoServiceLayers);
export const selectFeatureSources = createSelector(selectCatalogState, state => state.featureSources);
export const selectCatalogLoadStatus = createSelector(selectCatalogState, state => state.catalogLoadStatus);
export const selectCatalogLoadError = createSelector(selectCatalogState, state => state.catalogLoadError);

export const selectCatalogNodeById = (id: string) => createSelector(
  selectCatalog,
  (catalog): ExtendedCatalogNodeModel | null => catalog.find(node => node.id === id) || null,
);

export const selectGeoServiceById = (id: string) => createSelector(
  selectGeoServices,
  (services): ExtendedGeoServiceModel | null => services.find(service => service.id === id) || null,
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
    return CatalogHelper.findParentsForNode(catalog, id);
  },
);

export const selectCatalogTree = createSelector(
  selectCatalog,
  selectGeoServices,
  selectGeoServiceLayers,
  selectFeatureSources,
  (catalog, services, layers, featureSources): CatalogTreeModel[] => {
    return CatalogHelper.catalogToTree(catalog, services, layers, featureSources);
  },
);
