import { FormModel } from '@tailormap-admin/admin-api';

export type FormUpdateModel = Omit<FormModel, 'id' | 'fields' | 'featureSourceId' | 'featureTypeName'>;
