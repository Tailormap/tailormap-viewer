import { ApplicationModel } from '@tailormap-admin/admin-api';
import { I18nSettingsModel } from '@tailormap-viewer/api';


export interface UpdateDraftApplicationModel {
  application: Omit<ApplicationModel, 'id'>;
  i18nSettings?: I18nSettingsModel;
}
