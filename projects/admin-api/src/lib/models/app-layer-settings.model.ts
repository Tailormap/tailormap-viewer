import { HiddenLayerFunctionality, Tileset3dStyle } from '@tailormap-viewer/api';

export interface AppLayerSettingsModel {
  title?: string;
  opacity?: number;
  attribution?: string | null;
  description?: string | null;
  editable?: boolean;
  formId?: number | null;
  searchIndexId?: number | null;
  hideAttributes?: string[] | null;
  editableAttributes?: string[] | null;
  autoRefreshInSeconds?: number | null;
  tileset3dStyle?: Tileset3dStyle | null;
  hiddenFunctionality?: HiddenLayerFunctionality[] | null;
}
