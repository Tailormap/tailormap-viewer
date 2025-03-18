export enum HideFunctionality {
  objectInformation = 'object-information',
  attributeList = 'attribute-list',
  export = 'export',
}

export interface AppLayerSettingsModel {
  title?: string;
  opacity?: number;
  attribution?: string | null;
  description?: string | null;
  editable?: boolean;
  formId?: number | null;
  searchIndexId?: number | null;
  hideAttributes?: string[] | null;
  readOnlyAttributes?: string[] | null;
  autoRefreshInSeconds?: number | null;
  hiddenFunctionality?: HideFunctionality[] | null;
}
