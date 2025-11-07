import { AttributeSettingsModel } from './attribute-settings.model';
import { FeatureTypeTemplateModel } from './feature-type-template.model';

export interface AttachmentAttributeModel {
  attributeName: string;
  mimeType: string | null;
  maxAttachmentSize: number | null;
}

export interface FeatureTypeSettingsModel {
  template?: FeatureTypeTemplateModel;
  attributeOrder?: string[];
  hideAttributes?: string[];
  editableAttributes?: string[];
  attributeSettings?: Record<string, AttributeSettingsModel>;
  attachmentAttributes?: AttachmentAttributeModel[];
}
