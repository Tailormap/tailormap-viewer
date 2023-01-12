import { FeatureModelType } from '../models/feature-model.type';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import WKT from 'ol/format/WKT';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { Circle } from 'ol/geom';
import { fromCircle } from 'ol/geom/Polygon';
import { MapSizeHelper } from '../helpers/map-size.helper';
import { MapUnitEnum } from '../models/map-unit.enum';
import { GeometryTypeHelper } from './geometry-type.helper';
import { Projection } from 'ol/proj';

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
          const geometry = FeatureHelper.fromWKT(feature);
          return new Feature(geometry);
        } catch (e) {
          return null;
        }
      }
      if (FeatureHelper.isFeatureModel(feature)) {
        if (!feature.geometry) {
          return null;
        }
        return new Feature<Geometry>({
          __fid: feature.__fid,
          attributes: feature.attributes,
          geometry: FeatureHelper.fromWKT(feature.geometry),
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
    projection?: Projection,
  ): FeatureModel<T> | null {
    const geom = feature.getGeometry();
    if (geom && feature.get('__fid') && feature.get('attributes')) {
      return {
        __fid: feature.get('__fid'),
        attributes: feature.get('attributes'),
        geometry: !projection ? undefined : FeatureHelper.getWKT(geom, projection),
      };
    }
    return null;
  }

  public static getWKT(geometry: Geometry, projection: Projection, linearizeCircle: boolean = false) {
    const units = projection.getUnits();
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
    if (geometry.startsWith('CIRCLE')) {
      return FeatureHelper.readCircleWKT(geometry, sourceProjection, mapProjection);
    }
    if (!sourceProjection || !mapProjection || sourceProjection === mapProjection) {
      return FeatureHelper.wktFormatter.readGeometry(geometry);
    }
    return FeatureHelper.wktFormatter.readGeometry(geometry, {
      dataProjection: sourceProjection,
      featureProjection: mapProjection,
    });
  }

  private static readCircleWKT(geometry: string, sourceProjection?: string, mapProjection?: string) {
    const circleXY = geometry.replace('CIRCLE(', '').replace(')', '').split(' ');
    const center = [ parseFloat(circleXY[0]), parseFloat(circleXY[1]) ];
    const radius = parseFloat(circleXY[2]);
    const geom = new Circle(center, radius);
    if (!sourceProjection || !mapProjection || sourceProjection === mapProjection) {
      return geom;
    }
    return geom.transform(sourceProjection, mapProjection);
  }

}
