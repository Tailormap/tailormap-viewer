import { OIDCConfigurationModel } from './oidc-configuration.model';

export interface OIDCClientSecretExpirationInfo {
  configuration: OIDCConfigurationModel;
  clientSecretExpired: boolean;
  clientSecretExpirationDays: number;
  clientSecretExpirationCategory: 'valid' | 'warning' | 'expired';
}
