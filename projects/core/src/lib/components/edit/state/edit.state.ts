import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FeatureInfoFeatureModel } from '../../feature-info/models/feature-info-feature.model';
import { FeatureInfoColumnMetadataModel } from '../../feature-info/models/feature-info-column-metadata.model';
import { DrawingType } from '@tailormap-viewer/map';

export const editStateKey = 'edit';

export interface EditState {
  isActive: boolean;
  isCopyOtherLayerFeaturesActive: boolean;
  isCreateNewFeatureActive: boolean;
  newGeometryType: DrawingType | null;
  selectedLayer: string | null;
  selectedCopyLayer: string | null;
  copiedFeatures: FeatureInfoFeatureModel[];
  mapCoordinates?: [number, number];
  dialogVisible: boolean;
  dialogCollapsed: boolean;
  loadStatus: LoadingStateEnum;
  features: FeatureInfoFeatureModel[];
  columnMetadata: FeatureInfoColumnMetadataModel[];
  selectedFeature: string | null;
  errorMessage?: string;
  openedFromFeatureInfo?: boolean;
}

export const initialEditState: EditState = {
  isActive: false,
  isCopyOtherLayerFeaturesActive: false,
  isCreateNewFeatureActive: false,
  newGeometryType: null,
  selectedLayer: null,
  selectedCopyLayer: null,
  copiedFeatures: [],
  dialogVisible: false,
  dialogCollapsed: false,
  loadStatus: LoadingStateEnum.INITIAL,
  features: [],
  columnMetadata: [],
  selectedFeature: null,
};
