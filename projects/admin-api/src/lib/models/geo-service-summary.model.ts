import { GeoServiceProtocolEnum } from './geo-service-protocol.enum';
import { GeoServiceSettingsModel } from './geo-service-settings.model';
import { AuthorizationRuleGroup } from './authorization-rules.model';
import { AdminServerType } from './admin-server-type.model';

export interface GeoServiceSummaryModel {
  id: string;
  title: string;
  type: 'geo-service';
  protocol: GeoServiceProtocolEnum;
  settings?: GeoServiceSettingsModel;
  authorizationRules: AuthorizationRuleGroup[];
  resolvedServerType?: AdminServerType;
}
