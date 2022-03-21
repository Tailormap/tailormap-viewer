import { LoadStatusEnum } from '@tailormap-viewer/shared';
import { FeatureInfoFeatureModel } from '../models/feature-info-feature.model';
import { FeatureInfoColumnMetadataModel } from '../models/feature-info-column-metadata.model';

export const featureInfoStateKey = 'feature_info';

export interface FeatureInfoState {
  mouseCoordinates?: [number, number];
  mapCoordinates?: [number, number];
  dialogVisible: boolean;
  dialogCollapsed: boolean;
  loadStatus: LoadStatusEnum;
  features: FeatureInfoFeatureModel[];
  columnMetadata: FeatureInfoColumnMetadataModel[];
  currentFeatureIndex: number;
  errorMessage?: string;
}

export const initialFeatureInfoState: FeatureInfoState = {
  dialogVisible: false,
  dialogCollapsed: false,
  loadStatus: LoadStatusEnum.INITIAL,
  features: [],
  columnMetadata: [],
  currentFeatureIndex: 0,
};
