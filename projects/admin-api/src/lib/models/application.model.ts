import { BoundsModel, ComponentModel, ViewerStylingModel } from '@tailormap-viewer/api';
import { AppContentModel } from './app-content.model';
import { AppSettingsModel } from './app-settings.model';
import { AuthorizationRuleGroup } from './authorization-rules.model';

export interface ApplicationModel {
  id: string;
  name: string;
  title?: string;
  adminComments?: string;
  previewText?: string;
  crs?: string;
  initialExtent?: BoundsModel;
  maxExtent?: BoundsModel;
  contentRoot?: AppContentModel;
  settings?: AppSettingsModel;
  components?: ComponentModel[];
  styling?: ViewerStylingModel;
  authorizationRules: AuthorizationRuleGroup[];
}
