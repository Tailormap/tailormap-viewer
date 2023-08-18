import { AttributeSettingsModel } from './attribute-settings.model';

export interface FeatureTypeSettingsModel {
  attributeOrder?: string[];
  hiddenAttributes?: string[];
  attributeSettings?: AttributeSettingsModel[];
}
