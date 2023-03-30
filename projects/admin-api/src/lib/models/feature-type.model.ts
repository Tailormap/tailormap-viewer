import { AttributeDescriptorModel } from './attribute-descriptor.model';
import { FeatureTypeInfoModel } from './feature-type-info.model';

export interface FeatureTypeModel {
  id: string;
  name: string;
  title: string;
  comment?: string;
  owner?: string;
  writable?: boolean;
  info?: FeatureTypeInfoModel;
  defaultGeometryAttribute?: string;
  primaryKeyAttribute?: string;
  attributes: AttributeDescriptorModel[];
  settings: Record<string, any>;
  defaultGeometryDescriptor?: AttributeDescriptorModel;
}
