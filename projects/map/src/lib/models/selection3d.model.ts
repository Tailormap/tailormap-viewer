import { Color as CesiumColor } from 'cesium';

export interface Selection3dModel {
  position: { x: number; y: number; z: number };
  featureId?: number;
  featureOriginalColor?: CesiumColor;
  featureProperties?: { id: string; value: any }[];
}
