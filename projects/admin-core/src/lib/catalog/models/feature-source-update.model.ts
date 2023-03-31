import { FeatureSourceModel, FeatureTypeModel } from '@tailormap-admin/admin-api';

export type FeatureSourceCreateModel = Pick<FeatureSourceModel, 'title' | 'protocol' | 'url' | 'jdbcConnection' | 'authentication'>;
export type FeatureSourceUpdateModel = Partial<FeatureSourceCreateModel>;
export type FeatureSourceWithIdUpdateModel = FeatureSourceUpdateModel & Pick<FeatureSourceModel, 'id'>;
export type FeatureTypeUpdateModel = Partial<Pick<FeatureTypeModel, 'title' | 'comment' | 'settings'>>;
