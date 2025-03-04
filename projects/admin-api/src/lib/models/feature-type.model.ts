import { AttributeDescriptorModel } from './attribute-descriptor.model';
import { FeatureTypeInfoModel } from './feature-type-info.model';
import { FeatureTypeSettingsModel } from './feature-type-settings.model';

export interface FeatureTypeModel {
  id: string; // XXX should actually be number
  name: string;
  title: string;
  comment?: string;
  owner?: string;
  writeable?: boolean;
  info?: FeatureTypeInfoModel;
  defaultGeometryAttribute: null | string;
  primaryKeyAttribute: null | string;
  attributes: AttributeDescriptorModel[];
  settings: FeatureTypeSettingsModel;
  defaultGeometryDescriptor?: AttributeDescriptorModel;
}
