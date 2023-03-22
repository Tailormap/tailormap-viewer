import { FeatureSourceModel } from '@tailormap-admin/admin-api';

export interface ExtendedFeatureSourceModel extends FeatureSourceModel {
  catalogNodeId: string;
  children?: string[];
  expanded?: boolean;
}
