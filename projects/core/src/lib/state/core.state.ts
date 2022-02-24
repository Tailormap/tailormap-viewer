import {
  AppLayerModel, BoundsModel, ComponentModel, CoordinateReferenceSystemModel, Language, LoadingStateEnum, SecurityModel, ServiceModel,
} from '@tailormap-viewer/api';

export const coreStateKey = 'core';

export interface ApplicationState {
  id?: number;
  apiVersion?: string;
  name?: string;
  title?: string;
  lang?: Language;
  styling?: object;
}

export interface MapState {
  initialExtent?: BoundsModel;
  maxExtent?: BoundsModel;
  services: ServiceModel[];
  baseLayers: AppLayerModel[];
  crs?: CoordinateReferenceSystemModel;
  components: ComponentModel[];
  layers: AppLayerModel[];
}

export interface CoreState {
  loadStatus: LoadingStateEnum;
  error?: string;
  routeBeforeLogin?: string;
  security: SecurityModel;
  application: ApplicationState;
  map: MapState;
}

export const initialCoreState: CoreState = {
  loadStatus: LoadingStateEnum.INITIAL,
  security: { loggedIn: false },
  application: {},
  map: {
    services: [],
    baseLayers: [],
    components: [],
    layers: [],
  },
};
