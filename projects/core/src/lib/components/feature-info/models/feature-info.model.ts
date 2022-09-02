import { AppLayerModel } from '@tailormap-viewer/api';

export interface FeatureInfoModel {
  layer: AppLayerModel;
  sortedAttributes: Array<{ label: string; attributeValue: any; key: string }>;
  geometry: string | null;
}
