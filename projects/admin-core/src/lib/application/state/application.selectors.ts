import { ApplicationState, applicationStateKey } from './application.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ApplicationTreeHelper } from '../helpers/application-tree.helper';
import { selectCatalog, selectFeatureTypes, selectGeoServiceLayers, selectGeoServices } from '../../catalog/state/catalog.selectors';
import { FilterHelper, LoadingStateEnum } from '@tailormap-viewer/shared';
import { AdminServerType, AppLayerSettingsModel, AppTreeNodeModel, GeoServiceProtocolEnum } from '@tailormap-admin/admin-api';
import { BaseComponentConfigHelper } from '@tailormap-viewer/api';
import { CatalogTreeModel } from '../../catalog/models/catalog-tree.model';
import { CatalogFilterHelper } from '../../catalog/helpers/catalog-filter.helper';
import { ApplicationModelHelper } from '../helpers/application-model.helper';
import { GeoServiceLayerInApplicationModel } from '../models/geo-service-layer-in-application.model';

const selectApplicationState = createFeatureSelector<ApplicationState>(applicationStateKey);

export const selectApplications = createSelector(selectApplicationState, state => state.applications);
export const selectApplicationsLoadStatus = createSelector(selectApplicationState, state => state.applicationsLoadStatus);
export const selectApplicationsLoadError = createSelector(selectApplicationState, state => state.applicationsLoadError);
export const selectApplicationListFilter = createSelector(selectApplicationState, state => state.applicationListFilter);
export const selectApplicationCatalogFilterTerm = createSelector(selectApplicationState, state => state.applicationCatalogFilterTerm);
export const selectApplicationLayerTreeFilterTerm = createSelector(selectApplicationState, state => state.applicationLayerTreeFilterTerm);
export const selectApplicationBaseLayerTreeFilterTerm = createSelector(selectApplicationState, state => state.applicationBaseLayerTreeFilterTerm);
export const selectDraftApplication = createSelector(selectApplicationState, state => state.draftApplication || null);
export const selectSelectedApplicationId = createSelector(selectApplicationState, state => state.draftApplication?.id || null);
export const selectApplicationServicesLoadStatus = createSelector(selectApplicationState, state => state.applicationServicesLoadStatus);
export const selectDraftApplicationUpdated = createSelector(selectApplicationState, state => state.draftApplicationUpdated);
export const selectDraftApplicationValid = createSelector(selectApplicationState, state => state.draftApplicationValid);
export const selectExpandedBaseLayerNodes = createSelector(selectApplicationState, state => state.expandedBaseLayerNodes);
export const selectExpandedAppLayerNodes = createSelector(selectApplicationState, state => state.expandedAppLayerNodes);
export const selectApplicationSelectedFilterLayerId = createSelector(selectApplicationState, state => state.applicationSelectedFilterLayerId);
export const selectApplicationSelectedFilterId = createSelector(selectApplicationState, state => state.applicationSelectedFilterId);
export const selectSelectedApplicationName = createSelector(selectApplicationState, state => state.draftApplication?.name);

export const isLoadingApplicationServices = createSelector(
  selectApplicationServicesLoadStatus,
  status => status === LoadingStateEnum.LOADING,
);

export const selectApplicationList = createSelector(
  selectApplications,
  selectApplicationListFilter,
  (applications, filter) => {
    if (!filter) {
      return applications;
    }
    const filterTerms: string[] = FilterHelper.createFilterTerms(filter);
    return applications
      .filter(application => {
        const searchableContent = [ application.name, application.title ].join(' ');
        return FilterHelper.matchesFilterTerm(filterTerms, searchableContent);
      });
  },
);

export const selectApplicationById = (id: string) => createSelector(
  selectApplications,
  (applications) => {
    return applications.find(a => a.id === id) || null;
  },
);

export const selectSelectedApplicationLayerSettings = createSelector(
  selectDraftApplication,
  (application) => {
    return application?.settings?.layerSettings || {};
  },
);

export const selectAppLayerNodesForSelectedApplication = createSelector(
  selectDraftApplication,
  (application): AppTreeNodeModel[] => {
    if (!application?.contentRoot?.layerNodes) {
      return [];
    }
    return application.contentRoot.layerNodes;
  },
);

export const selectBaseLayerNodesForSelectedApplication = createSelector(
  selectDraftApplication,
  (application): AppTreeNodeModel[] => {
    if (!application?.contentRoot?.baseLayerNodes) {
      return [];
    }
    return application.contentRoot.baseLayerNodes;
  },
);

export const selectTerrainLayerNodesForSelectedApplication = createSelector(
  selectDraftApplication,
  (application): AppTreeNodeModel[] => {
    if (!application?.contentRoot?.terrainLayerNodes) {
      return [];
    }
    return application.contentRoot.terrainLayerNodes;
  },
);

export const selectAppLayerTreeForSelectedApplication = createSelector(
  selectAppLayerNodesForSelectedApplication,
  selectGeoServiceLayers,
  selectExpandedAppLayerNodes,
  selectSelectedApplicationLayerSettings,
  selectApplicationLayerTreeFilterTerm,
  (layerNodes, layers, expandedNodes: string[], layerSettings: Record<string, AppLayerSettingsModel>, filterTerm?: string) => {
    return ApplicationTreeHelper.layerTreeNodeToTree(layerNodes, layers, expandedNodes, layerSettings, 'layer', filterTerm);
  },
);

export const selectBaseLayerTreeForSelectedApplication = createSelector(
  selectBaseLayerNodesForSelectedApplication,
  selectGeoServiceLayers,
  selectExpandedBaseLayerNodes,
  selectSelectedApplicationLayerSettings,
  selectApplicationBaseLayerTreeFilterTerm,
  (baseLayerNodes, layers, expandedNodes: string[], layerSettings: Record<string, AppLayerSettingsModel>, filterTerm?: string) => {
    return ApplicationTreeHelper.layerTreeNodeToTree(baseLayerNodes, layers, expandedNodes, layerSettings, 'baseLayer', filterTerm);
  },
);

export const selectTerrainLayerTreeForSelectedApplication = createSelector(
  selectTerrainLayerNodesForSelectedApplication,
  selectGeoServiceLayers,
  selectSelectedApplicationLayerSettings,
  (terrainLayerNodes, layers, layerSettings: Record<string, AppLayerSettingsModel>) => {
    return ApplicationTreeHelper.layerTreeNodeToTree(terrainLayerNodes, layers, ['root'], layerSettings, 'terrainLayer');
  },
);

export const selectSomeExpandedAppLayerForSelectedApplication = createSelector(
  selectExpandedAppLayerNodes,
  expanded => expanded.length !== 0,
);

export const selectSomeExpandedBaseLayersForSelectedApplication = createSelector(
  selectExpandedBaseLayerNodes,
  expanded => expanded.length !== 0,
);

export const selectComponentsConfig = createSelector(selectDraftApplication, application => application?.components);

export const selectComponentsConfigByType = (type: string) => createSelector(
  selectComponentsConfig,
  config => {
    if (!config || !Array.isArray(config)) {
      return undefined;
    }
    return (config || []).find(c => c.type === type);
  },
);

export const selectDisabledComponentsForSelectedApplication = createSelector(
  selectComponentsConfig,
  (config): string[] => {
    const defaultDisabled = Array.from(BaseComponentConfigHelper.componentsDisabledByDefault);
    if (!config || !Array.isArray(config)) {
      return defaultDisabled;
    }
    return [
      ...defaultDisabled.filter(c => !config.find(cmp => cmp.type === c)?.config.enabled),
      ...config.filter(c => !c.config.enabled).map(c => c.type),
    ];
  });

export const selectDraftApplicationCrs = createSelector(
  selectDraftApplication,
  draftApplication => draftApplication?.crs,
);

export const selectBaseServiceLayerTreeForApplication = createSelector(
  selectDraftApplicationCrs,
  selectCatalog,
  selectGeoServices,
  selectGeoServiceLayers,
  selectFeatureTypes,
  selectApplicationCatalogFilterTerm,
  (draftApplicationCrs, catalog, services, layers, featureTypes, filterTerm): CatalogTreeModel[] => {
    return CatalogFilterHelper.filterTreeByCrs(catalog, services, layers, featureTypes, draftApplicationCrs, filterTerm);
});

export const selectTerrainServiceLayerTreeForApplication = createSelector(
  selectCatalog,
  selectGeoServices,
  selectGeoServiceLayers,
  selectFeatureTypes,
  (catalog, services, layers, featureTypes): CatalogTreeModel[] => {
    return CatalogFilterHelper.filterTreeByProtocol(catalog, services, layers, featureTypes, GeoServiceProtocolEnum.QUANTIZEDMESH);
  },
);

export const selectTiles3DServiceLayerTreeForApplication = createSelector(
  selectCatalog,
  selectGeoServices,
  selectGeoServiceLayers,
  selectFeatureTypes,
  (catalog, services, layers, featureTypes): CatalogTreeModel[] => {
    return CatalogFilterHelper.filterTreeByProtocol(catalog, services, layers, featureTypes, GeoServiceProtocolEnum.TILES3D);
  },
);

export const selectServiceLayerTreeForApplication = createSelector(
  selectBaseServiceLayerTreeForApplication,
  selectTiles3DServiceLayerTreeForApplication,
  (layers2D, tiles3dLayers) => {
    return layers2D.concat(tiles3dLayers);
  },
);

export const selectStylingConfig = createSelector(selectDraftApplication, application => application?.styling);

export const selectFilterGroups = createSelector(selectDraftApplication, application => application?.settings?.filterGroups || []);

export const selectFilterableLayersForApplication = createSelector(
  selectAppLayerNodesForSelectedApplication,
  selectGeoServiceLayers,
  selectGeoServices,
  selectFeatureTypes,
  (appLayersNodes, geoServiceLayers, geoServices, featureTypes): GeoServiceLayerInApplicationModel[] => {
    const geoServiceLayerMap = ApplicationTreeHelper.getLayerMap(geoServiceLayers);
    return appLayersNodes
      .filter(layer => ApplicationModelHelper.isLayerTreeNode(layer))
      .map(layerNode => ({
        geoServiceLayer: geoServiceLayerMap.get(ApplicationTreeHelper.getLayerMapKey(layerNode.layerName, layerNode.serviceId)),
        appLayerId: layerNode.id,
      }))
      .filter(({ geoServiceLayer, appLayerId: _appLayerId }) => {
        if (!geoServiceLayer) {
          return false;
        }
        const geoService = geoServices.find(service => service.id === geoServiceLayer.serviceId);
        const isGeoServer = geoService?.settings?.serverType === AdminServerType.GEOSERVER
          || ((geoService?.settings?.serverType === AdminServerType.AUTO && geoService.resolvedServerType === AdminServerType.GEOSERVER));
        if (!geoServiceLayer.layerSettings?.featureType) {
          return false;
        }
        const featureTypeOfLayer = featureTypes.find(featureType => {
          return featureType.featureSourceId === geoServiceLayer.layerSettings!.featureType!.featureSourceId.toString()
            && featureType.name === geoServiceLayer.layerSettings!.featureType!.featureTypeName;
        });
        return !!featureTypeOfLayer && isGeoServer;
      })
      .map(geoServiceLayerInApplication => ({
        geoServiceLayer: geoServiceLayerInApplication.geoServiceLayer!,
        appLayerId: geoServiceLayerInApplication.appLayerId,
      }));
  },
);
