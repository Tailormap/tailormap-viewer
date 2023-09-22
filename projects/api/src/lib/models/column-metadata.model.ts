import { AttributeType } from './attribute-type.enum';

export interface ColumnMetadataModel {
  key: string;
  type: AttributeType;
  alias?: string;
}
