import { Color as CesiumColor } from 'cesium';

export interface Selection3dModel {
  position: { latitude: number; longitude: number };
  featureId?: number;
  featureOriginalColor?: CesiumColor;
  featureProperties?: { id: string; value: any }[];
}
