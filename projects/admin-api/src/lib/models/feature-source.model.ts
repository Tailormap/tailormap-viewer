import { FeatureSourceProtocolEnum } from './feature-source-protocol.enum';
import { JdbcConnectionPropertiesModel } from './jdbc-connection-properties.model';
import { ServiceAuthenticationModel } from './service-authentication.model';
import { FeatureTypeModel } from './feature-type.model';
import { ServiceCapsModel } from './service-caps.model';

export interface FeatureSourceModel {
  id: string;
  type: 'feature-source';
  title: string;
  notes?: string;
  protocol: FeatureSourceProtocolEnum;
  url: string;
  authentication?: ServiceAuthenticationModel;
  jdbcConnection?: JdbcConnectionPropertiesModel;
  serviceCapabilities?: ServiceCapsModel;
  featureTypes: FeatureTypeModel[];
}
