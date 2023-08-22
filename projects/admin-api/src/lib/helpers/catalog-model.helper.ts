import { FeatureSourceModel, FeatureTypeModel, GeoServiceModel } from '../models';

export class CatalogModelHelper {

  private static GEO_SERVICE_TYPE = 'geo-service';
  private static FEATURE_SOURCE_TYPE = 'feature-source';

  public static addTypeToGeoServiceModel<T extends GeoServiceModel>(service: T): T {
    return { ...service, type: CatalogModelHelper.GEO_SERVICE_TYPE };
  }

  public static addTypeAndFeatureTypesToFeatureSourceModel<T extends FeatureSourceModel & { allFeatureTypes?: FeatureTypeModel[] }>(source: T): T {
    return {
      ...source,
      type: CatalogModelHelper.FEATURE_SOURCE_TYPE,
      featureTypes: source.allFeatureTypes || source.featureTypes || [],
    };
  }

  public static isGeoServiceModel(model: any): model is GeoServiceModel {
    return !!model && model.type && model.type === CatalogModelHelper.GEO_SERVICE_TYPE;
  }

  public static isFeatureSourceModel(model: any): model is FeatureSourceModel {
    return !!model && model.type && model.type === CatalogModelHelper.FEATURE_SOURCE_TYPE;
  }

}
