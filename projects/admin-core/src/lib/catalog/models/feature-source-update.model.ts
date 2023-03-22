import { FeatureSourceModel } from '@tailormap-admin/admin-api';

export type FeatureSourceCreateModel = Pick<FeatureSourceModel, 'title' | 'protocol' | 'url' | 'jdbcConnection' | 'authentication'>;
export type FeatureSourceUpdateModel = Partial<FeatureSourceCreateModel>;
export type FeatureSourceWithIdUpdateModel = FeatureSourceUpdateModel & Pick<FeatureSourceModel, 'id'>;
