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
export const selectSelectedApplicationId = createSelector(selectApplicationState, state => state.selectedApplication);
export const selectApplicationServicesLoadStatus = createSelector(selectApplicationState, state => state.applicationServicesLoadStatus);

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

export const selectSelectedApplication = createSelector(
  selectApplications,
  selectSelectedApplicationId,
  (applications, selectedApplicationId) => {
    return selectedApplicationId
      ? applications.find(a => a.id === selectedApplicationId) || null
      : null;
  },
);

export const selectAppLayerTreeForSelectedApplication = createSelector(
  selectSelectedApplication,
  selectGeoServiceLayers,
  (application, layers) => {
    if (!application?.contentRoot?.layerNodes) {
      return [];
    }
    return ApplicationTreeHelper.layerTreeNodeToTree(application.contentRoot.layerNodes, layers);
  },
);

export const selectBaseLayerTreeForSelectedApplication = createSelector(
  selectSelectedApplication,
  selectGeoServiceLayers,
  (application, layers) => {
    if (!application?.contentRoot?.baseLayerNodes) {
      return [];
    }
    return ApplicationTreeHelper.layerTreeNodeToTree(application.contentRoot.baseLayerNodes, layers, true);
  },
);

export const selectComponentsConfig = createSelector(selectSelectedApplication, application => application?.components);

export const selectComponentsConfigByType = (type: string) => createSelector(
  selectComponentsConfig,
  config => {
    if (!config || !Array.isArray(config)) {
      return undefined;
    }
    return (config || []).find(c => c.type === type);
  },
);
