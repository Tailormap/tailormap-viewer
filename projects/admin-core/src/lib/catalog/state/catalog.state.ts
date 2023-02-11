import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { FeatureSourceModel } from '@tailormap-admin/admin-api';

export const catalogStateKey = 'geoRegistry';

export interface CatalogState {
  catalogLoadStatus: LoadingStateEnum;
  catalogLoadError?: string;
  catalog: ExtendedCatalogNodeModel[];
  geoServices: ExtendedGeoServiceModel[];
  featureSources: FeatureSourceModel[];
}

export const initialCatalogState: CatalogState = {
  catalogLoadStatus: LoadingStateEnum.INITIAL,
  catalog: [],
  geoServices: [],
  featureSources: [],
};
