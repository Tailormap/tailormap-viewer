import { FeatureAttributeTypeEnum } from './feature-attribute-type.enum';

export interface ColumnMetadataModel {
  key: string;
  type: FeatureAttributeTypeEnum;
  alias?: string;
}
