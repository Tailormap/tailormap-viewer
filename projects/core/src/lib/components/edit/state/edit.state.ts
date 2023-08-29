import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FeatureInfoFeatureModel } from '../../feature-info/models/feature-info-feature.model';
import { FeatureInfoColumnMetadataModel } from '../../feature-info/models/feature-info-column-metadata.model';

export const editStateKey = 'edit';

export interface EditState {
  isActive: boolean;
  isCreateNewFeatureActive: boolean;
  selectedLayer: string | null;
  mapCoordinates?: [number, number];
  dialogVisible: boolean;
  dialogCollapsed: boolean;
  loadStatus: LoadingStateEnum;
  features: FeatureInfoFeatureModel[];
  columnMetadata: FeatureInfoColumnMetadataModel[];
  selectedFeature: string | null;
  errorMessage?: string;
}

export const initialEditState: EditState = {
  isActive: false,
  isCreateNewFeatureActive: false,
  selectedLayer: null,
  dialogVisible: false,
  dialogCollapsed: false,
  loadStatus: LoadingStateEnum.INITIAL,
  features: [],
  columnMetadata: [],
  selectedFeature: null,
};
