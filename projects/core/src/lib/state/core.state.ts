import {
  AppLayerModel, BoundsModel, ComponentModel, CoordinateReferenceSystemModel, Language, LoadingStateEnum, ServiceModel,
} from '@tailormap-viewer/api';

export const coreStateKey = 'core';

export interface CoreState {
  loadStatus: LoadingStateEnum;
  error?: string;
  id?: number;
  apiVersion?: string;
  name?: string;
  title?: string;
  lang?: Language;
  styling?: object;
  initialExtent?: BoundsModel;
  maxExtent?: BoundsModel;
  services: ServiceModel[];
  baseLayers: AppLayerModel[];
  crs?: CoordinateReferenceSystemModel;
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
