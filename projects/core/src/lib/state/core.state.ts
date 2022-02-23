import {
  AppLayerModel, BoundsModel, ComponentModel, CoordinateReferenceSystemModel, Language, LoadingStateEnum, SecurityModel, ServiceModel,
} from '@tailormap-viewer/api';

export const coreStateKey = 'core';

export interface CoreState {
  loadStatus: LoadingStateEnum;
  routeBeforeLogin?: string;
  security: SecurityModel;
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
  security: { loggedIn: false },
  services: [],
  baseLayers: [],
  components: [],
  layers: [],
};
