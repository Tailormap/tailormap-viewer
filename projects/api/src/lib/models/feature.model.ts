export interface FeatureModel {
  __fid: string;
  geometry?: string;
  attributes: Record<string, string | number | boolean | null>;
}
