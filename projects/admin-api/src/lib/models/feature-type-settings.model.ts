import { AttributeSettingsModel } from './attribute-settings.model';

export interface FeatureTypeSettingsModel {
  attributeOrder?: string[];
  hideAttributes?: string[];
  readOnlyAttributes?: string[];
  attributeSettings?: Record<string, AttributeSettingsModel>;
}
