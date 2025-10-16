import { HiddenLayerFunctionality } from '@tailormap-viewer/api';
import { TilesetStyle } from '@tailormap-viewer/shared';

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
  tileset3dStyle?: TilesetStyle | null;
  hiddenFunctionality?: HiddenLayerFunctionality[] | null;
}
