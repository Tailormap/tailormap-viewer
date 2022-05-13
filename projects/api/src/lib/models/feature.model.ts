export interface FeatureModelAttributes {
  isCircle?: boolean;
  center?: number[];
  radius?: number;
  [x: string]: any;
}

export interface FeatureModel<AttributesType extends FeatureModelAttributes = FeatureModelAttributes> {
  __fid: string;
  geometry?: string;
  attributes: AttributesType;
}
