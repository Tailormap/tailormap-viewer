import { GeoServiceProtocolEnum } from './geo-service-protocol.enum';
import { GeoServiceSettingsModel } from './geo-service-settings.model';
import { AuthorizationRuleGroup } from './authorization-rules.model';

export interface GeoServiceSummaryModel {
  id: string;
  title: string;
  type: 'geo-service';
  protocol: GeoServiceProtocolEnum;
  settings?: GeoServiceSettingsModel;
  authorizationRules: AuthorizationRuleGroup[];
}
