import { FeatureModel } from '@tailormap-viewer/api';

export class FeatureHelper {

  public static getGeometryForFeature(feature: FeatureModel, geomAttribute: string): string | null {
    if (feature.geometry) {
      return feature.geometry;
    }
    return (feature.attributes[geomAttribute] as string) || null;
  }

}
