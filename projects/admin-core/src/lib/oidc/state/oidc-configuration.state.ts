import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { OIDCConfigurationModel } from '@tailormap-admin/admin-api';

export const oidcConfigurationStateKey = 'admin-oidc-configuration';

export interface OIDCConfigurationState {
  oidcConfigurationsLoadStatus: LoadingStateEnum;
  oidcConfigurationsLoadError?: string;
  oidcConfigurations: OIDCConfigurationModel[];
  oidcConfigurationListFilter?: string | null;
  draftOIDCConfiguration?: OIDCConfigurationModel | null;
  draftOIDCConfigurationUpdated: boolean;
}

export const initialOIDCConfigurationState: OIDCConfigurationState = {
  oidcConfigurationsLoadStatus: LoadingStateEnum.INITIAL,
  oidcConfigurations: [],
  draftOIDCConfigurationUpdated: false,
};
