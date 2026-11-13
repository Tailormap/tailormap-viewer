import { AppLayerSettingsModel, FeatureTypeModel, FormModel } from '@tailormap-admin/admin-api';

export interface FormFieldWarnings {
  /** Fields not shown in the viewer: the attribute is hidden or no longer exists in the feature type */
  notShown: string[];
  /** Fields shown read-only in the viewer because the attribute is not editable, while the form field is not disabled */
  readOnly: string[];
  /** Fields marked required in the form which can't be edited, so a new feature can't get a value */
  requiredReadOnly: string[];
}

/**
 * Determines how the settings of the feature type (catalog) and, when a form is selected for an application layer, the
 * application layer settings affect the fields of a form in the viewer. The viewer always applies the most restrictive
 * setting, these warnings tell the admin where the form configuration is overruled.
 */
export class FormWarningHelper {

  public static getFieldWarnings(
    form: FormModel | null,
    featureType: FeatureTypeModel | null,
    appLayerSettings?: AppLayerSettingsModel | null,
  ): FormFieldWarnings {
    const warnings: FormFieldWarnings = { notShown: [], readOnly: [], requiredReadOnly: [] };
    if (!form || !featureType) {
      return warnings;
    }
    const attributes = new Set(featureType.attributes.map(a => a.name));
    const hidden = new Set([
      ...featureType.settings.hideAttributes || [],
      ...appLayerSettings?.hideAttributes || [],
    ]);
    const catalogEditable = new Set(featureType.settings.editableAttributes || []);
    const appLayerReadOnly = new Set(appLayerSettings?.readOnlyAttributes || []);
    form.fields.forEach(field => {
      if (!attributes.has(field.name) || hidden.has(field.name)) {
        warnings.notShown.push(field.name);
        return;
      }
      const editable = catalogEditable.has(field.name) && !appLayerReadOnly.has(field.name);
      if (field.required && (!editable || field.disabled)) {
        warnings.requiredReadOnly.push(field.name);
      } else if (!editable && !field.disabled) {
        warnings.readOnly.push(field.name);
      }
    });
    return warnings;
  }

  public static hasWarnings(warnings: FormFieldWarnings): boolean {
    return warnings.notShown.length > 0 || warnings.readOnly.length > 0 || warnings.requiredReadOnly.length > 0;
  }

}
