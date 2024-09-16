import { AppLayerModel } from '@tailormap-viewer/api';

export interface FeatureInfoModel {
  __fid: string;
  layer: AppLayerModel;
  sortedAttributes: Array<{ label: string; attributeValue: any; key: string }>;
  geometry: string | null;
}
