import { ApplicationState, applicationStateKey } from './application.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ApplicationTreeHelper } from '../helpers/application-tree.helper';
import { selectGeoServiceLayers } from '../../catalog/state/catalog.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

const selectApplicationState = createFeatureSelector<ApplicationState>(applicationStateKey);

export const selectApplications = createSelector(selectApplicationState, state => state.applications);
export const selectApplicationsLoadStatus = createSelector(selectApplicationState, state => state.applicationsLoadStatus);
export const selectApplicationsLoadError = createSelector(selectApplicationState, state => state.applicationsLoadError);
export const selectApplicationListFilter = createSelector(selectApplicationState, state => state.applicationListFilter);
export const selectDraftApplication = createSelector(selectApplicationState, state => state.draftApplication || null);
export const selectSelectedApplicationId = createSelector(selectApplicationState, state => state.draftApplication?.id || null);
export const selectApplicationServicesLoadStatus = createSelector(selectApplicationState, state => state.applicationServicesLoadStatus);
export const selectDraftApplicationUpdated = createSelector(selectApplicationState, state => state.draftApplicationUpdated);

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
    const filterRegexes: RegExp[] = filter.trim().split(' ').map(f => new RegExp(f, 'i'));
    return applications
      .filter(application => {
        const searchableContent = [ application.name, application.title ].join(' ');
        return filterRegexes.every(f => f.test(searchableContent));
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

export const selectAppLayerTreeForSelectedApplication = createSelector(
  selectDraftApplication,
  selectGeoServiceLayers,
  (application, layers) => {
    if (!application?.contentRoot?.layerNodes) {
      return [];
    }
    return ApplicationTreeHelper.layerTreeNodeToTree(application.contentRoot.layerNodes, layers);
  },
);

export const selectBaseLayerTreeForSelectedApplication = createSelector(
  selectDraftApplication,
  selectGeoServiceLayers,
  (application, layers) => {
    if (!application?.contentRoot?.baseLayerNodes) {
      return [];
    }
    return ApplicationTreeHelper.layerTreeNodeToTree(application.contentRoot.baseLayerNodes, layers, true);
  },
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
    if (!config || !Array.isArray(config)) {
      return [];
    }
    return (config || [])
      .filter(c => !c.config.enabled)
      .map(c => c.type);
  });

export const selectStylingConfig = createSelector(selectDraftApplication, application => application?.styling);
