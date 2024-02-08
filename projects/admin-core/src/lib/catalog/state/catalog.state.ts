import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { FeatureSourceModel, GeoServiceWithLayersModel } from '@tailormap-admin/admin-api';

export const catalogStateKey = 'catalog';

export interface CatalogState {
  catalogLoadStatus: LoadingStateEnum;
  catalogLoadError?: string;
  catalog: ExtendedCatalogNodeModel[];
  filterTerm?: string;
  geoServices: ExtendedGeoServiceModel[];
  geoServiceLayers: ExtendedGeoServiceLayerModel[];
  draftGeoServiceId: string | null;
  draftGeoService: GeoServiceWithLayersModel | null;
  draftGeoServiceLoadStatus: LoadingStateEnum;
  featureSources: ExtendedFeatureSourceModel[];
  featureTypes: ExtendedFeatureTypeModel[];
  draftFeatureSourceId: string | null;
  draftFeatureSource: FeatureSourceModel | null;
  draftFeatureSourceLoadStatus: LoadingStateEnum;
}

export const initialCatalogState: CatalogState = {
  catalogLoadStatus: LoadingStateEnum.INITIAL,
  catalog: [],
  geoServices: [],
  geoServiceLayers: [],
  draftGeoServiceId: null,
  draftGeoService: null,
  draftGeoServiceLoadStatus: LoadingStateEnum.INITIAL,
  featureSources: [],
  featureTypes: [],
  draftFeatureSourceId: null,
  draftFeatureSource: null,
  draftFeatureSourceLoadStatus: LoadingStateEnum.INITIAL,
};
