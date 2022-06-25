import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';

export interface AttributeListColumnModel {
  id: string;
  label: string;
  type: FeatureAttributeTypeEnum;
  visible: boolean;
}
