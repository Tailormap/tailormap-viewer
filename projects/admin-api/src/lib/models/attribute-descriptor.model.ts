import { AttributeType } from '@tailormap-viewer/api';

export interface AttributeDescriptorModel {
  id: string;
  name: string;
  comment?: string;
  type: AttributeType;
  unknownTypeClassName?: string;
  description?: string;
  geometry?: boolean;
}
