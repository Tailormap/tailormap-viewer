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
  initialExtent: BoundsModel | null;
  maxExtent: BoundsModel | null;
  contentRoot?: AppContentModel;
  settings?: AppSettingsModel;
  components?: ComponentModel[];
  styling?: ViewerStylingModel;
  authorizationRules: AuthorizationRuleGroup[];
  readonly createdBy?: string | null;
  readonly lastModifiedBy?: string | null;
  // these dates are in format 2025-10-23T11:09:42.253370769Z
  readonly createdDate?: string | null;
  readonly lastModifiedDate?: string | null;
}
