export interface FeatureTypeSummaryModel {
  id: string;
  type: 'feature-type';
  name: string;
  title: string;
  writeable?: boolean;
  hasAttributes: boolean;
  defaultGeometryAttribute: null | string;
  primaryKeyAttribute: null | string;
}
