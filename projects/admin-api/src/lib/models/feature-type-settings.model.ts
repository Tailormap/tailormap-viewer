import { AttributeSettingsModel } from './attribute-settings.model';

export interface FeatureTypeSettingsModel {
  attributeOrder?: string[];
  hideAttributes?: string[];
  attributeSettings?: Record<string, AttributeSettingsModel>;
}
