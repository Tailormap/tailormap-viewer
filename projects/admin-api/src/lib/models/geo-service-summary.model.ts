import { AuthorizationRuleGroup, GeoServiceProtocolEnum, GeoServiceSettingsModel } from '@tailormap-admin/admin-api';

export interface GeoServiceSummaryModel {
  id: string;
  title: string;
  type: 'geo-service';
  protocol: GeoServiceProtocolEnum;
  settings?: GeoServiceSettingsModel;
  authorizationRules: AuthorizationRuleGroup[];
}
