
export interface FeatureInfo3DModel {
  featureId: number;
  layerId: string;
  columnMetadata: [];
  properties: {id: string, value: any}[];
}

export interface Selection3dModel {
  position: { x: number; y: number; z: number };
  featureInfo?: FeatureInfo3DModel;
}
