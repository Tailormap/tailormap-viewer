import { AttributeDescriptorSettingModel } from './attribute-descriptor-setting.model';

export interface FeatureTypeSettingsModel {
  attributeOrder?: string[];
  hiddenAttributes?: string[];
  attributeSettings?: AttributeDescriptorSettingModel[];
}
