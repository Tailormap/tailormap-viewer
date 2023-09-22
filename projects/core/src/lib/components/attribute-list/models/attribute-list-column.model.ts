import { AttributeType } from '@tailormap-viewer/api';

export interface AttributeListColumnModel {
  id: string;
  label: string;
  type: AttributeType;
  visible: boolean;
}
