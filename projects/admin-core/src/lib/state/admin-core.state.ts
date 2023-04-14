import { SecurityModel } from '@tailormap-viewer/api';

export const adminCoreStateKey = 'adminCore';

export interface AdminCoreState {
  security: SecurityModel;
  routeBeforeLogin?: string;
}

export const initialAdminCoreState: AdminCoreState = {
  security: { isAuthenticated: false },
};
