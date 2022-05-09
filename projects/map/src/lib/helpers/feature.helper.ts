import { FeatureModelType } from '../models/feature-model.type';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import WKT from 'ol/format/WKT';
import { FeatureModel } from '@tailormap-viewer/api';

export class FeatureHelper {

  private static wktFormatter = new WKT();

  private static isFeatureModel(feature: FeatureModelType): feature is FeatureModel {
    return !!(feature as FeatureModel).__fid;
  }

  public static getFeatures(featureModel?: FeatureModelType | FeatureModelType[]): Feature<Geometry>[] {
    if (!featureModel) {
      return [];
    }

    const features = Array.isArray(featureModel)
      ? featureModel
      : [ featureModel ];

    return features.map(feature => {
      if (typeof feature === 'string') {
        try {
          return FeatureHelper.wktFormatter.readFeature(feature);
        } catch (e) {
          return null;
        }
      }
      if (FeatureHelper.isFeatureModel(feature)) {
        return new Feature<Geometry>({
          __fid: feature.__fid,
          attributes: feature.attributes,
          geometry: FeatureHelper.wktFormatter.readGeometry(feature.geometry),
        });
      }
      if (feature instanceof Geometry) {
        return new Feature<Geometry>({ geometry: feature });
      }
      return feature;
    }).filter((f: Feature<Geometry> | null): f is Feature<Geometry> => f !== null);
  }

  public static getFeatureModelForFeature(feature: Feature<Geometry>): FeatureModel | null {
    const geom = feature.getGeometry();
    if (geom && feature.get('__fid') && feature.get('attributes')) {
      return {
        __fid: feature.get('__fid'),
        attributes: feature.get('attributes'),
        geometry: FeatureHelper.wktFormatter.writeGeometry(geom),
      };
    }
    return null;
  }

}
