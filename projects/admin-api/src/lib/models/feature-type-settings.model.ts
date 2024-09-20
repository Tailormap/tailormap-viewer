import { AttributeSettingsModel } from './attribute-settings.model';
import { FeatureTypeTemplateModel } from './feature-type-template.model';

export interface FeatureTypeSettingsModel {
  template?: FeatureTypeTemplateModel;
  attributeOrder?: string[];
  hideAttributes?: string[];
  readOnlyAttributes?: string[];
  attributeSettings?: Record<string, AttributeSettingsModel>;
}
