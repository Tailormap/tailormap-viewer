import { CatalogState, catalogStateKey } from './catalog.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CatalogTreeModel } from '../models/catalog-tree.model';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { GeoServiceLayerSettingsModel } from '../models/geo-service-layer-settings.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { CatalogFilterHelper } from '../helpers/catalog-filter.helper';
import { ExtendedGeoServiceAndLayerModel } from '../models/extended-geo-service-and-layer.model';

const selectCatalogState = createFeatureSelector<CatalogState>(catalogStateKey);

export const selectCatalog = createSelector(selectCatalogState, state => state.catalog);
export const selectFilterTerm = createSelector(selectCatalogState, state => state.filterTerm);
export const selectGeoServices = createSelector(selectCatalogState, state => state.geoServices);
export const selectGeoServiceLayers = createSelector(selectCatalogState, state => state.geoServiceLayers);
export const selectFeatureSources = createSelector(selectCatalogState, state => state.featureSources);
export const selectFeatureTypes = createSelector(selectCatalogState, state => state.featureTypes);
export const selectCatalogLoadStatus = createSelector(selectCatalogState, state => state.catalogLoadStatus);
export const selectCatalogLoadError = createSelector(selectCatalogState, state => state.catalogLoadError);
export const selectDraftGeoServiceId = createSelector(selectCatalogState, state => state.draftGeoServiceId);
export const selectDraftGeoService = createSelector(selectCatalogState, state => state.draftGeoService);
export const selectDraftGeoServiceLoadStatus = createSelector(selectCatalogState, state => state.draftGeoServiceLoadStatus);
export const selectDraftFeatureSourceId = createSelector(selectCatalogState, state => state.draftFeatureSourceId);
export const selectDraftFeatureSource = createSelector(selectCatalogState, state => state.draftFeatureSource);
export const selectDraftFeatureSourceLoadStatus = createSelector(selectCatalogState, state => state.draftFeatureSourceLoadStatus);

export const selectCatalogRootNodeId = createSelector(selectCatalog, catalog => {
  const rootNode = catalog.find(node => node.root);
  return rootNode ? rootNode.id : null;
});

export const selectCatalogNodeById = (id: string) => createSelector(
  selectCatalog,
  (catalog): ExtendedCatalogNodeModel | null => catalog.find(node => node.id === id) || null,
);

export const selectGeoServiceById = (id: string) => createSelector(
  selectGeoServices,
  (services): ExtendedGeoServiceModel | null => services.find(service => service.id === id) || null,
);

export const selectGeoServiceLayersByGeoServiceId = (serviceId: string) => createSelector(
  selectGeoServiceLayers,
  (geoServiceLayers): ExtendedGeoServiceLayerModel[] => geoServiceLayers.filter(l => l.serviceId == serviceId),
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

export const selectFeatureSourceAndFeatureTypesById = (id: string) => createSelector(
  selectFeatureSourceById(id),
  selectFeatureTypesForSource(id),
  (source, featureTypes): ExtendedFeatureSourceModel & { featureTypes: ExtendedFeatureTypeModel[] } | null => {
    if (!source) {
      return null;
    }
    return {
      ...source,
      featureTypes,
    };
  },
);

export const selectFeatureSourceByFeatureTypeId = (featureTypeId: string) => createSelector(
  selectFeatureSources,
  featureSources => featureSources.find(f => (f.featureTypesIds || []).includes(featureTypeId)),
);

export const selectGeoServiceByLayerId = (layerId: string) => createSelector(
  selectGeoServices,
  services => services.find(s => (s.layerIds || []).includes(layerId)),
);

export const selectGeoServiceAndLayerByLayerId = (layerId: string) => createSelector(
  selectGeoServiceByLayerId(layerId),
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

export const selectGeoServiceLayerSettingsByLayerId = (layerId: string) => createSelector(
  selectGeoServiceAndLayerByLayerId(layerId),
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

export const selectCatalogTree = createSelector(
  selectCatalog,
  selectGeoServices,
  selectGeoServiceLayers,
  selectFeatureSources,
  selectFeatureTypes,
  selectFilterTerm,
  (catalog, services, layers, featureSources, featureTypes, filterTerm): CatalogTreeModel[] => {
    return CatalogFilterHelper.filterTreeByFilterTerm(catalog, services, layers, featureSources, featureTypes, filterTerm);
  },
);

export const selectGeoServiceAndLayerByName = (serviceId: string, layerName: string) => createSelector(
  selectGeoServiceById(serviceId),
  selectGeoServiceLayers,
  (service, layers): ExtendedGeoServiceAndLayerModel | null => {
    if (!service) {
      return null;
    }
    const layer = layers.find(l => l.name === layerName && l.serviceId === service.id);
    if (!layer) {
      return null;
    }
    const layerSettings = (service.settings?.layerSettings || {})[layerName] || null;
    const fullTitle = [layer.title];
    if (layer.title !== layer.name) {
      fullTitle.push(`(${layer.name})`);
    }
    return { service, fullLayerName: fullTitle.join(' '), layer, layerSettings };
  },
);
