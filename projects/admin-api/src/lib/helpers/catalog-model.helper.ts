import {
  FeatureSourceModel, FeatureSourceSummaryModel, FeatureTypeModel, GeoServiceModel, GeoServiceSummaryModel,
} from '../models';

export class CatalogModelHelper {

  public static GEO_SERVICE_TYPE = 'geo-service';
  public static FEATURE_SOURCE_TYPE = 'feature-source';

  public static addTypeToGeoServiceSummaryModel<T extends GeoServiceSummaryModel>(service: T): T {
    return { ...service, type: CatalogModelHelper.GEO_SERVICE_TYPE };
  }

  public static addTypeToGeoServiceModel<T extends GeoServiceModel>(service: T): T {
    return { ...service, type: CatalogModelHelper.GEO_SERVICE_TYPE };
  }

  public static addTypeAndFeatureTypesToFeatureSourceSummaryModel<T extends FeatureSourceSummaryModel>(source: T): T {
    return {
      ...source,
      id: `${source.id}`,
      type: CatalogModelHelper.FEATURE_SOURCE_TYPE,
    };
  }

  public static addTypeAndFeatureTypesToFeatureSourceModel<T extends FeatureSourceModel & { allFeatureTypes?: FeatureTypeModel[] }>(source: T): T {
    return {
      ...source,
      id: `${source.id}`,
      type: CatalogModelHelper.FEATURE_SOURCE_TYPE,
      allFeatureTypes: undefined,
      featureTypes: (source.allFeatureTypes || source.featureTypes || []).map(ft => ({ ...ft, id: `${ft.id}` })),
    };
  }

}
