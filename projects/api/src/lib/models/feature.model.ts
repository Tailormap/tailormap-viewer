export interface FeatureModelAttributes {
  buffer?: number;
  [x: string]: any;
}

export interface FeatureModel<AttributesType extends FeatureModelAttributes = FeatureModelAttributes> {
  __fid: string;
  geometry?: string;
  attributes: AttributesType;
  crs?: string;
}
