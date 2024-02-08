export interface FeatureTypeSummaryModel {
  id: string;
  type: 'feature-type';
  name: string;
  title: string;
  writeable?: boolean;
  hasAttributes: boolean;
}
