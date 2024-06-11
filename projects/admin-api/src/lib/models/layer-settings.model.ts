import { TileLayerHiDpiModeEnum } from '@tailormap-viewer/api';
import { AuthorizationRuleGroup } from './authorization-rules.model';

export interface LayerSettingsModel {
  title?: string;
  description?: string;
  hiDpiDisabled?: boolean;
  hiDpiMode?: TileLayerHiDpiModeEnum;
  hiDpiSubstituteLayer?: string;
  featureType?: { featureSourceId: number; featureTypeName: string };
  attribution?: string;
  legendImageId?: string;
  authorizationRules?: AuthorizationRuleGroup[];
}
