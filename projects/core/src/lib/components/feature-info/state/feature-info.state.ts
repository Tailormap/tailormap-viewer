import { FeatureInfoModel } from '../models/feature-info.model';
import { LoadStatusEnum } from '@tailormap-viewer/shared';

export const featureInfoStateKey = 'feature_info';

export interface FeatureInfoState {
  mouseCoordinates?: [number, number];
  mapCoordinates?: [number, number];
  dialogVisible: boolean;
  dialogCollapsed: boolean;
  loadStatus: LoadStatusEnum;
  featureInfo: FeatureInfoModel[];
  errorMessage?: string;
}

export const initialFeatureInfoState: FeatureInfoState = {
  dialogVisible: false,
  dialogCollapsed: false,
  loadStatus: LoadStatusEnum.INITIAL,
  featureInfo: [],
};
