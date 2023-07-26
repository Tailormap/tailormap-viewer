import { createAction, props } from '@ngrx/store';
import { OIDCConfigurationModel } from '@tailormap-admin/admin-api';

const oidcConfigurationActionsPrefix = '[OIDCConfiguration]';

export const loadOIDCConfigurations = createAction(
  `${oidcConfigurationActionsPrefix} Load configurations`,
);

export const loadOIDCConfigurationsStart = createAction(
  `${oidcConfigurationActionsPrefix} Load Applications Start`,
);

export const loadOIDCConfigurationsSuccess = createAction(
  `${oidcConfigurationActionsPrefix}  Load Applications Success`,
  props<{ oidcConfigurations: OIDCConfigurationModel[] }>(),
);

export const loadOIDCConfigurationsFailed = createAction(
  `${oidcConfigurationActionsPrefix}  Load Applications Failed`,
  props<{ error?: string }>(),
);

export const setSelectedOIDCConfiguration = createAction(
  `${oidcConfigurationActionsPrefix} Set Selected Configuration`,
  props<{ oidcConfigurationId: number | null }>(),
);

export const clearSelectedOIDCConfiguration = createAction(
  `${oidcConfigurationActionsPrefix} Clear Selected Configuration`,
);

export const setOIDCConfigurationListFilter = createAction(
  `${oidcConfigurationActionsPrefix} Set OIDCConfiguration List Filter`,
  props<{ filter: string | null | undefined }>(),
);

export const addOIDCConfiguration = createAction(
  `${oidcConfigurationActionsPrefix} Add Configurations`,
  props<{ oidcConfiguration: OIDCConfigurationModel }>(),
);

export const updateOIDCConfiguration = createAction(
  `${oidcConfigurationActionsPrefix} Update Configuration`,
  props<{ oidcConfiguration: OIDCConfigurationModel }>(),
);

export const deleteOIDCConfiguration = createAction(
  `${oidcConfigurationActionsPrefix} Delete Configuration`,
  props<{ oidcConfigurationId: number }>(),
);

export const updateDraftOIDCConfiguration = createAction(
  `${oidcConfigurationActionsPrefix} Update Draft Configuration`,
  props<{ oidcConfiguration: Omit<OIDCConfigurationModel, 'id'> }>(),
);
