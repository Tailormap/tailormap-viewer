export interface OIDCConfigurationModel {
  id: number;
  name: string;
  clientId: string;
  clientSecret?: string;
  issuerUrl: string;
  userNameAttribute: string;
  status?: string;
}
