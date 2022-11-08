import { ComponentModel, Language, SecurityModel } from '@tailormap-viewer/api';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

export const coreStateKey = 'core';

export interface ApplicationState {
  id?: number;
  apiVersion?: string;
  name?: string;
  title?: string;
  lang?: Language;
  styling?: object;
  components: ComponentModel[];
}

export interface CoreState {
  loadStatus: LoadingStateEnum;
  error?: string;
  routeBeforeLogin?: string;
  security: SecurityModel;
  application?: ApplicationState;
}

export const initialCoreState: CoreState = {
  loadStatus: LoadingStateEnum.INITIAL,
  security: { loggedIn: false },
};
