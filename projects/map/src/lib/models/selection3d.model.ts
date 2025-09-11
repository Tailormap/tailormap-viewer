import { AttributeType } from '@tailormap-viewer/api';

export interface FeatureInfo3DModel {
  featureId: number;
  layerId: string;
  columnMetadata: { layerId: string; name: string; type: AttributeType }[];
  properties: {id: string; value: any}[];
  primitiveIndex: number;
}

export interface Selection3dModel {
  position: { x: number; y: number; z: number };
  mouseCoordinates: { x: number; y: number };
  featureInfo?: FeatureInfo3DModel;
}
