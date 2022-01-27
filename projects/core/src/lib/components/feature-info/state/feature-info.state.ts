import { FeatureInfoModel } from '../models/feature-info.model';

export const featureInfoStateKey = 'feature_info';

export interface FeatureInfoState {
  mouseCoordinates?: [number, number];
  mapCoordinates?: [number, number];
  dialogVisible: boolean;
  loadingData: boolean;
  featureInfo: FeatureInfoModel[];
  loadingDataFailed: boolean;
  errorMessage?: string;
}

export const initialFeatureInfoState: FeatureInfoState = {
  dialogVisible: false,
  loadingData: false,
  loadingDataFailed: false,
  featureInfo: [],
};
