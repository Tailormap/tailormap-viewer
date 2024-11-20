import { OIDCConfigurationState, oidcConfigurationStateKey } from './oidc-configuration.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FilterHelper } from '@tailormap-viewer/shared';

const selectOIDCConfigurationState = createFeatureSelector<OIDCConfigurationState>(oidcConfigurationStateKey);

export const selectOIDCConfigurations = createSelector(selectOIDCConfigurationState, state => state.oidcConfigurations);
export const selectOIDCConfigurationsLoadStatus = createSelector(selectOIDCConfigurationState, state => state.oidcConfigurationsLoadStatus);
export const selectOIDCConfigurationsLoadError = createSelector(selectOIDCConfigurationState, state => state.oidcConfigurationsLoadError);
export const selectOIDCConfigurationListFilter = createSelector(selectOIDCConfigurationState, state => state.oidcConfigurationListFilter);
export const selectSelectedOIDCConfigurationId = createSelector(selectOIDCConfigurationState, state => state.draftOIDCConfiguration?.id || null);
export const selectDraftOIDCConfiguration = createSelector(selectOIDCConfigurationState, state => state.draftOIDCConfiguration);
export const selectDraftOIDCConfigurationUpdated = createSelector(selectOIDCConfigurationState, state => state.draftOIDCConfigurationUpdated);

export const selectOIDCConfigurationList = createSelector(
  selectOIDCConfigurations,
  selectOIDCConfigurationListFilter,
  (oidcConfigurations, filter) => {
    if (!filter) {
      return oidcConfigurations;
    }
    const filterTerms: string[] = FilterHelper.createFilterTerms(filter);
    return oidcConfigurations
      .filter(oidcConfiguration => {
        const searchableContent = [oidcConfiguration.name].join(' ');
        return FilterHelper.matchesFilterTerm(filterTerms, searchableContent);
      });
  },
);

export const selectOIDCConfigurationById = (id: number) => createSelector(
  selectOIDCConfigurations,
  (oidcConfigurations) => {
    return oidcConfigurations.find(a => a.id === id) || null;
  },
);
