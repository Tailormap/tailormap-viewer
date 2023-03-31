import { FeatureTypeModel } from '@tailormap-admin/admin-api';

export class GeoServiceHelper {

  public static findPossibleFeatureType(layerName: string, featureTypes: FeatureTypeModel[]): FeatureTypeModel | null {
    const layerBaseName = GeoServiceHelper.getLayerBaseName(layerName);
    const featureType = featureTypes.find((ft) => ft.name === layerName) || null;
    if (featureType !== null) {
      return featureType;
    }
    return featureTypes.find((ft) => ft.name === layerBaseName) || null;
  }

  public static getLayerBaseName(layerName: string) {
    const colonIndex = layerName.indexOf(':');
    if (colonIndex !== -1) {
      return layerName.substring(colonIndex + 1);
    }
    return layerName;
  }

}
