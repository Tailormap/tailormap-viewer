import { AttributeTypeEnum } from './attribute-type.enum';

export interface AttributeDescriptorModel {
  id: string;
  name: string;
  comment?: string;
  type: AttributeTypeEnum;
  unknownTypeClassName?: string;
  description?: string;
  geometry?: boolean;
}
