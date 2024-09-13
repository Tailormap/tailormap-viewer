import { LoadingStateEnum } from '@tailormap-viewer/shared';

export interface FeatureInfoLayerModel {
  id: string;
  title: string;
  loading: LoadingStateEnum;
  error?: string;
  totalCount?: number;
  selectedFeatureId?: string;
}
