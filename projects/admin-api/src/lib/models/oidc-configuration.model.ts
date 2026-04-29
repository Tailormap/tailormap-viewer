export interface OIDCConfigurationModel {
  id: number;
  name: string;
  clientId: string;
  clientSecret?: string;
  clientSecretExpiry: string | null;
  issuerUrl: string;
  userNameAttribute: string;
  status?: string;
  image?: string | null;
}
