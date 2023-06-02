import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';

export const catalogStateKey = 'catalog';

export interface CatalogState {
  catalogLoadStatus: LoadingStateEnum;
  catalogLoadError?: string;
  catalog: ExtendedCatalogNodeModel[];
  geoServices: ExtendedGeoServiceModel[];
  geoServicesLoadStatus: LoadingStateEnum;
  geoServiceLayers: ExtendedGeoServiceLayerModel[];
  featureSources: ExtendedFeatureSourceModel[];
  featureTypes: ExtendedFeatureTypeModel[];
  featureSourcesLoadStatus: LoadingStateEnum;
}

export const initialCatalogState: CatalogState = {
  catalogLoadStatus: LoadingStateEnum.INITIAL,
  catalog: [],
  geoServices: [],
  geoServicesLoadStatus: LoadingStateEnum.INITIAL,
  geoServiceLayers: [],
  featureSources: [],
  featureTypes: [],
  featureSourcesLoadStatus: LoadingStateEnum.INITIAL,
};
