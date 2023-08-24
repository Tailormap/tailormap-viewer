import { TileLayerHiDpiModeEnum } from '@tailormap-viewer/api';
import { AuthorizationRuleGroup } from './authorization-rules.model';

export interface LayerSettingsModel {
  title?: string;
  description?: string;
  hiDpiDisabled?: boolean;
  tilingDisabled?: boolean;
  tilingGutter?: number;
  hiDpiMode?: TileLayerHiDpiModeEnum;
  hiDpiSubstituteLayer?: string;
  minZoom?: number;
  maxZoom?: number;
  featureType?: { featureSourceId: number; featureTypeName: string };
  attribution?: string;
  authorizationRules?: AuthorizationRuleGroup[];
}
