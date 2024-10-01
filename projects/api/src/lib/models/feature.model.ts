export interface FeatureModelAttributes {
  buffer?: string;
  [x: string]: any;
}

export interface FeatureModel<AttributesType extends FeatureModelAttributes = FeatureModelAttributes> {
  __fid: string;
  geometry?: string;
  attributes: AttributesType;
  crs?: string;
}
