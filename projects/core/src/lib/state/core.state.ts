import {
  AppLayerModel, BoundsModel, ComponentModel, CoordinateReferenceSystem, Language, LoadingStateEnum, ServiceModel,
} from '@tailormap-viewer/api';

export interface CoreState {
  loadStatus: LoadingStateEnum;
  error?: string;
  id?: number;
  api_version?: string;
  name?: string;
  title?: string;
  lang?: Language;
  styling?: object;
  initialExtent?: BoundsModel;
  maxExtent?: BoundsModel;
  services: ServiceModel[];
  baseLayers: AppLayerModel[];
  crs?: CoordinateReferenceSystem;
  components: ComponentModel[];
  layers: AppLayerModel[];
}

export const initialCoreState: CoreState = {
  loadStatus: LoadingStateEnum.INITIAL,
  services: [],
  baseLayers: [],
  components: [],
  layers: [],
};
