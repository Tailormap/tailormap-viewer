import * as OIDCConfigurationActions from './oidc-configuration.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { OIDCConfigurationState, initialOIDCConfigurationState } from './oidc-configuration.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import {
    OIDCConfigurationModel,
} from '@tailormap-admin/admin-api';

const updateOIDCConfiguration = (
  state: OIDCConfigurationState,
  updateMethod: (oidcConfiguration: OIDCConfigurationModel) => Partial<OIDCConfigurationModel>,
) => {
  if (!state.draftOIDCConfiguration) {
    return state;
  }
  return {
    ...state,
    draftOIDCConfiguration: {
      ...state.draftOIDCConfiguration,
      ...updateMethod(state.draftOIDCConfiguration),
    },
    draftOIDCConfigurationUpdated: true,
  };
};

const onLoadOIDCConfigurationStart = (state: OIDCConfigurationState): OIDCConfigurationState => ({
  ...state,
  oidcConfigurationsLoadStatus: LoadingStateEnum.LOADING,
  oidcConfigurationsLoadError: undefined,
  oidcConfigurations: [],
});

const onLoadOIDCConfigurationsSuccess = (
  state: OIDCConfigurationState,
  payload: ReturnType<typeof OIDCConfigurationActions.loadOIDCConfigurationsSuccess>,
): OIDCConfigurationState => ({
  ...state,
  oidcConfigurationsLoadStatus: LoadingStateEnum.LOADED,
  oidcConfigurationsLoadError: undefined,
  oidcConfigurations: payload.oidcConfigurations,
});

const onLoadOIDCConfigurationsFailed = (
  state: OIDCConfigurationState,
  payload: ReturnType<typeof OIDCConfigurationActions.loadOIDCConfigurationsFailed>,
): OIDCConfigurationState => ({
  ...state,
  oidcConfigurationsLoadStatus: LoadingStateEnum.FAILED,
  oidcConfigurationsLoadError: payload.error,
  oidcConfigurations: [],
});

const onSetOIDCConfigurationListFilter = (
  state: OIDCConfigurationState,
  payload: ReturnType<typeof OIDCConfigurationActions.setOIDCConfigurationListFilter>,
): OIDCConfigurationState => ({
  ...state,
  oidcConfigurationListFilter: payload.filter,
});

const onSetSelectedOIDCConfiguration = (
  state: OIDCConfigurationState,
  payload: ReturnType<typeof OIDCConfigurationActions.setSelectedOIDCConfiguration>,
): OIDCConfigurationState => {
  const draftOIDCConfiguration = payload.oidcConfigurationId !== null
    ? state.oidcConfigurations.find(a => a.id === payload.oidcConfigurationId)
    : null;
  return {
    ...state,
    draftOIDCConfiguration: draftOIDCConfiguration ? { ...draftOIDCConfiguration } : null,
    draftOIDCConfigurationUpdated: false,
  };
};

const onClearSelectedOIDCConfiguration = (state: OIDCConfigurationState): OIDCConfigurationState => ({
  ...state,
  draftOIDCConfiguration: null,
  draftOIDCConfigurationUpdated: false,
});

const onAddOIDCConfiguration = (
  state: OIDCConfigurationState,
  payload: ReturnType<typeof OIDCConfigurationActions.addOIDCConfiguration>,
): OIDCConfigurationState => {
  if(state.oidcConfigurations.some(a => a.id === payload.oidcConfiguration.id)) {
    return state;
  }
  return {
    ...state,
    oidcConfigurations: [ ...state.oidcConfigurations, payload.oidcConfiguration ],
  };
};

const onUpdateOIDCConfiguration = (
  state: OIDCConfigurationState,
  payload: ReturnType<typeof OIDCConfigurationActions.updateOIDCConfiguration>,
): OIDCConfigurationState => {
  const updatedOIDCConfiguration = payload.oidcConfiguration;
  const idx = state.oidcConfigurations.findIndex(oidcConfiguration => oidcConfiguration.id === updatedOIDCConfiguration.id);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    oidcConfigurations: [
      ...state.oidcConfigurations.slice(0, idx),
      { ...state.oidcConfigurations[idx], ...updatedOIDCConfiguration },
      ...state.oidcConfigurations.slice(idx + 1),
    ],
  };
};

const onDeleteOIDCConfiguration = (
  state: OIDCConfigurationState,
  payload: ReturnType<typeof OIDCConfigurationActions.deleteOIDCConfiguration>,
): OIDCConfigurationState => ({
  ...state,
  oidcConfigurations: state.oidcConfigurations.filter(oidcConfiguration => oidcConfiguration.id !== payload.oidcConfigurationId),
  draftOIDCConfiguration: state.draftOIDCConfiguration?.id === payload.oidcConfigurationId ? null : state.draftOIDCConfiguration,
});

const onUpdateDraftOIDCConfiguration = (
  state: OIDCConfigurationState,
  payload: ReturnType<typeof OIDCConfigurationActions.updateDraftOIDCConfiguration>,
): OIDCConfigurationState => {
  return updateOIDCConfiguration(state, oidcConfiguration => ({
    ...oidcConfiguration,
    ...payload.oidcConfiguration,
  }));
};

const oidcConfigurationReducerImpl = createReducer<OIDCConfigurationState>(
  initialOIDCConfigurationState,
  on(OIDCConfigurationActions.loadOIDCConfigurationsStart, onLoadOIDCConfigurationStart),
  on(OIDCConfigurationActions.loadOIDCConfigurationsSuccess, onLoadOIDCConfigurationsSuccess),
  on(OIDCConfigurationActions.loadOIDCConfigurationsFailed, onLoadOIDCConfigurationsFailed),
  on(OIDCConfigurationActions.setOIDCConfigurationListFilter, onSetOIDCConfigurationListFilter),
  on(OIDCConfigurationActions.setSelectedOIDCConfiguration, onSetSelectedOIDCConfiguration),
  on(OIDCConfigurationActions.clearSelectedOIDCConfiguration, onClearSelectedOIDCConfiguration),
  on(OIDCConfigurationActions.addOIDCConfiguration, onAddOIDCConfiguration),
  on(OIDCConfigurationActions.updateOIDCConfiguration, onUpdateOIDCConfiguration),
  on(OIDCConfigurationActions.deleteOIDCConfiguration, onDeleteOIDCConfiguration),
  on(OIDCConfigurationActions.updateDraftOIDCConfiguration, onUpdateDraftOIDCConfiguration),
);

export const oidcConfigurationReducer = (state: OIDCConfigurationState | undefined, action: Action) => oidcConfigurationReducerImpl(state, action);
