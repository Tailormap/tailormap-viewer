import { FeatureSourceProtocolEnum } from './feature-source-protocol.enum';

export interface FeatureSourceSummaryModel {
  id: string;
  type: 'feature-source';
  title: string;
  protocol: FeatureSourceProtocolEnum;
}
