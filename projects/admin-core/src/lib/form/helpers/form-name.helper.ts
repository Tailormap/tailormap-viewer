import { FormSummaryModel } from '@tailormap-admin/admin-api';

/**
 * Form names are not unique in the API, but forms are selected by name in the application layer settings, where only the forms for the
 * feature type of the layer are listed. To avoid confusion, the admin requires a form name to be unique per feature source and feature
 * type (ignoring case and surrounding whitespace).
 */
export class FormNameHelper {

  public static isNameTaken(
    forms: FormSummaryModel[],
    name: string | null | undefined,
    featureSourceId: number | null | undefined,
    featureTypeName: string | null | undefined,
    excludeFormId?: number | null,
  ): boolean {
    const normalizedName = FormNameHelper.normalize(name);
    if (!normalizedName || featureSourceId === null || featureSourceId === undefined || !featureTypeName) {
      return false;
    }
    return forms.some(form => form.id !== excludeFormId
      && form.featureSourceId === featureSourceId
      && form.featureTypeName === featureTypeName
      && FormNameHelper.normalize(form.name) === normalizedName);
  }

  /**
   * Returns the name, or the name with the first free " (n)" suffix if it is already taken for the feature type.
   */
  public static getUniqueName(
    forms: FormSummaryModel[],
    name: string,
    featureSourceId: number,
    featureTypeName: string,
  ): string {
    let uniqueName = name;
    let counter = 2;
    while (FormNameHelper.isNameTaken(forms, uniqueName, featureSourceId, featureTypeName)) {
      uniqueName = `${name} (${counter++})`;
    }
    return uniqueName;
  }

  private static normalize(name: string | null | undefined): string {
    return (name || '').trim().toLocaleLowerCase();
  }

}
