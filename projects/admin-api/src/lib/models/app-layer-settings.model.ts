export interface AppLayerSettingsModel {
  title?: string;
  opacity?: number;
  attribution?: string | null;
  description?: string | null;
  editable?: boolean;
  hideAttributes?: string[] | null;
  readOnlyAttributes?: string[] | null;
}
