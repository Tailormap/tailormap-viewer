import { SecurityModel } from '@tailormap-viewer/api';

export const adminCoreStateKey = 'admin-core';

export interface AdminCoreState {
  security: SecurityModel;
}

export const initialAdminCoreState: AdminCoreState = {
  security: { isAuthenticated: false },
};
