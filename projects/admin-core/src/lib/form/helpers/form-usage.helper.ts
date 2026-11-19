import { ApplicationModel } from '@tailormap-admin/admin-api';
import { ApplicationModelHelper } from '../../application/helpers/application-model.helper';

export interface FormUsageModel {
  application: ApplicationModel;
  appLayerId: string;
  layerTitle: string;
}

/**
 * An app layer references a form by `formId` in the layer settings of the application (JSON, so no foreign key in the
 * database). The API does not check this when deleting a form, so the admin does, like for geo services and feature sources.
 */
export class FormUsageHelper {

  /**
   * Returns the app layers that use the form. Only layers still in the layer tree count: settings of a removed layer can be
   * left behind, but they are not used and can't be changed in the admin anymore.
   */
  public static getAppLayersUsingForm(applications: ApplicationModel[], formId: number): FormUsageModel[] {
    return applications.flatMap(application => {
      const layerSettings = application.settings?.layerSettings || {};
      const layerNodes = [
        ...application.contentRoot?.layerNodes || [],
        ...application.contentRoot?.baseLayerNodes || [],
      ];
      return layerNodes
        .filter(ApplicationModelHelper.isLayerTreeNode)
        .filter(node => layerSettings[node.id]?.formId === formId)
        .map(node => ({
          application,
          appLayerId: node.id,
          layerTitle: layerSettings[node.id]?.title || node.layerName,
        }));
    });
  }

}
