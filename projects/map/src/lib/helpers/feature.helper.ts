import { FeatureModelType } from '../models/feature-model.type';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import WKT from 'ol/format/WKT';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { Circle } from 'ol/geom';
import { fromCircle } from 'ol/geom/Polygon';
import { MapSizeHelper } from '../helpers/map-size.helper';
import OlMap from 'ol/Map';
import { MapUnitEnum } from '../models/map-unit.enum';
import { GeometryTypeHelper } from './geometry-type.helper';

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
      : [featureModel];

    return features.map(feature => {
      if (typeof feature === 'string') {
        try {
          return FeatureHelper.wktFormatter.readFeature(feature);
        } catch (e) {
          return null;
        }
      }
      if (FeatureHelper.isFeatureModel(feature)) {
        const geometry = feature.attributes.isCircle && typeof feature.attributes.radius !== 'undefined' && typeof feature.attributes.center !== 'undefined'
          ? new Circle(feature.attributes.center, feature.attributes.radius)
          : FeatureHelper.wktFormatter.readGeometry(feature.geometry);
        return new Feature<Geometry>({
          __fid: feature.__fid,
          attributes: feature.attributes,
          geometry,
        });
      }
      if (feature instanceof Geometry) {
        return new Feature<Geometry>({ geometry: feature });
      }
      return feature;
    }).filter((f: Feature<Geometry> | null): f is Feature<Geometry> => f !== null);
  }

  public static getFeatureModelForFeature<T extends FeatureModelAttributes>(
    feature: Feature<Geometry>,
    map?: OlMap,
  ): FeatureModel<T> | null {
    const geom = feature.getGeometry();
    if (geom && feature.get('__fid') && feature.get('attributes')) {
      return {
        __fid: feature.get('__fid'),
        attributes: feature.get('attributes'),
        geometry: !map ? undefined : FeatureHelper.getWKT(geom, map),
      };
    }
    return null;
  }

  public static getWKT(geometry: Geometry, map: OlMap, linearizeCircle: boolean = false) {
    const units = map.getView().getProjection().getUnits();
    const decimals = MapSizeHelper.getCoordinatePrecision(units ? units.toLowerCase() as MapUnitEnum: MapUnitEnum.m);

    if (GeometryTypeHelper.isCircleGeometry(geometry) && !linearizeCircle) {
      return FeatureHelper.writeCircleWKT(geometry, decimals);
    }
    const geom = GeometryTypeHelper.isCircleGeometry(geometry) ? fromCircle(geometry) : geometry;
    return FeatureHelper.wktFormatter.writeGeometry(geom, { decimals });
  }

  private static writeCircleWKT(circle: Circle, decimals?: number): string {
    let xyr = [ circle.getCenter()[0], circle.getCenter()[1], circle.getRadius() ];
    if (decimals) {
      // Code from ol/format/Feature transformGeometryWithOptions()
      // Can't use directly on Circle Geometry because of radius
      const power = Math.pow(10, decimals);
      xyr = xyr.map(v => Math.round(v * power) / power);
    }
    return `CIRCLE(${xyr.join(' ')})`;
  }

  public static fromWKT(geometry: string, sourceProjection?: string, mapProjection?: string): Geometry {
    if (!sourceProjection || !mapProjection || sourceProjection === mapProjection) {
      return FeatureHelper.wktFormatter.readGeometry(geometry);
    }
    return FeatureHelper.wktFormatter.readGeometry(geometry, {
      dataProjection: sourceProjection,
      featureProjection: mapProjection,
    });
  }

}
