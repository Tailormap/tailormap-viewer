import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { ApplicationModel } from '@tailormap-admin/admin-api';

export const applicationStateKey = 'admin-application';

export interface ApplicationState {
  applicationsLoadStatus: LoadingStateEnum;
  applicationsLoadError?: string;
  applicationServicesLoadStatus: LoadingStateEnum;
  applications: ApplicationModel[];
  applicationListFilter?: string | null;
  draftApplicationId?: string | null;
  draftApplication?: ApplicationModel | null;
  draftApplicationUpdated: boolean;
  draftApplicationValid: boolean;
  expandedBaseLayerNodes: string[];
  expandedAppLayerNodes: string[];
  applicationCatalogFilterTerm?: string;
  applicationLayerTreeFilterTerm?: string;
  applicationBaseLayerTreeFilterTerm?: string;
}

export const initialApplicationState: ApplicationState = {
  applicationsLoadStatus: LoadingStateEnum.INITIAL,
  applications: [],
  applicationServicesLoadStatus: LoadingStateEnum.INITIAL,
  draftApplicationUpdated: false,
  draftApplicationValid: true,
  expandedBaseLayerNodes: [],
  expandedAppLayerNodes: [],
};
