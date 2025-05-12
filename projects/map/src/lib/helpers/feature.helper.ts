import { FeatureModelType } from '../models/feature-model.type';
import { Feature } from 'ol';
import { GeoJSON, WKT } from 'ol/format';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { Circle, Geometry, Point, Polygon } from 'ol/geom';
import { fromCircle, fromExtent } from 'ol/geom/Polygon';
import { MapSizeHelper } from '../helpers/map-size.helper';
import { MapUnitEnum } from '../models/map-unit.enum';
import { GeometryTypeHelper } from './geometry-type.helper';
import { Projection } from 'ol/proj';
import { Feature as GeoJSONFeature } from 'geojson';
import { WriteOptions } from 'ol/format/Feature';

export class FeatureHelper {

  private static wktFormatter = new WKT();
  private static geoJsonFormatter = new GeoJSON();

  /**
   * Transforms a GeoJSON geometry object to an ol.Geometry object; when the geometry is a point and a radius is given a circle is created.
   * @param geojsonGeometry The GeoJSON object to transform
   * @param radius The radius of the circle in case of a point
   * @param sourceProjection
   * @param mapProjection
   */
  public static fromGeoJSON(geojsonGeometry: object, radius?: number, sourceProjection?: string, mapProjection?: string): Geometry {
    if (/* geojsonGeometry['type'] === 'Point'  && */ radius) {
      const point = FeatureHelper.geoJsonFormatter.readGeometry(geojsonGeometry, {
        dataProjection: sourceProjection, featureProjection: mapProjection,
      }) as Point;
      return new Circle(point.getCoordinates(), radius);
    }

    return FeatureHelper.geoJsonFormatter.readGeometry(geojsonGeometry, {
      dataProjection: sourceProjection, featureProjection: mapProjection,
    });
  }

  /**
   * Transforms an ol.Geometry to a GeoJSON feature.
   * @param olGeometry The ol.Geometry object to transform
   * @param sourceProjection
   * @param mapProjection
   */
  public static toGeoJSON(olGeometry: Geometry, sourceProjection?: string, mapProjection?: string): GeoJSONFeature {
    if (olGeometry.getType() === 'Circle') {
      const circle = olGeometry as Circle;
      const feature = new Feature(new Point(circle.getCenter()));
      const geoJsonPoint = FeatureHelper.geoJsonFormatter.writeFeatureObject(feature, {
        dataProjection: sourceProjection, featureProjection: mapProjection,
      });
      if (!geoJsonPoint.properties) {
        geoJsonPoint.properties = {};
      }
      geoJsonPoint.properties['radius'] = circle.getRadius();
      return geoJsonPoint;
    }
    const feature = new Feature(olGeometry);
    return FeatureHelper.geoJsonFormatter.writeFeatureObject(feature, {
      dataProjection: sourceProjection, featureProjection: mapProjection,
    });
  }

  private static isFeatureModel(feature: FeatureModelType): feature is FeatureModel {
    return !!(feature as FeatureModel).__fid;
  }

  public static getFeatures(featureModel?: FeatureModelType | FeatureModelType[], mapProjection?: string): Feature<Geometry>[] {
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
          geometry: FeatureHelper.fromWKT(feature.geometry, feature.crs, mapProjection),
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

  public static getWKT(geometry: Geometry, projection?: Projection, linearizeCircle?: boolean): string {
    const writeOptions: WriteOptions = {};
    if (projection) {
      const units = projection.getUnits();
      writeOptions.decimals = MapSizeHelper.getCoordinatePrecision(units ? units.toLowerCase() as MapUnitEnum : MapUnitEnum.m);
    }

    if (GeometryTypeHelper.isCircleGeometry(geometry) && !linearizeCircle) {
      return FeatureHelper.writeCircleWKT(geometry, writeOptions.decimals);
    }
    const geom = GeometryTypeHelper.isCircleGeometry(geometry) ? fromCircle(geometry) : geometry;
    return FeatureHelper.wktFormatter.writeGeometry(geom, writeOptions);
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

  /**
   * Transforms a WKT geometry from one projection to another.
   *
   * @param wktGeom WKT of the geometry to transform
   * @param sourceProjection The projection of the geometry, eg. 'EPSG:28992'
   * @param targetProjection The projection to transform to, eg. 'EPSG:4326'
   */
  public static transformGeometry(wktGeom: string, sourceProjection: string, targetProjection: string): string {
    if (!sourceProjection || !targetProjection || sourceProjection === targetProjection) {
      return wktGeom;
    }
    const geom = FeatureHelper.wktFormatter.readGeometry(wktGeom, { dataProjection: sourceProjection });
    geom.transform(sourceProjection, targetProjection);
    return FeatureHelper.wktFormatter.writeGeometry(geom);
  }

  public static translateGeometryForDuplication(wktGeom: string, deltaX: number, deltaY: number): string {
    const geom = FeatureHelper.fromWKT(wktGeom);
    geom.translate(deltaX, deltaY);
    // XXX getWKT() only needs units, not the entire projection
    return FeatureHelper.getWKT(geom, { getUnits: () => (MapUnitEnum.m) } as Projection);
  }

  public static createRectangleAtPoint(point: Geometry, width: number, height: number): Polygon | null {
    if (!(point instanceof Point)) {
      return null;
    }
    const coords = point.getFlatCoordinates();
    return fromExtent([
      coords[0] - width / 2,
      coords[1] - height / 2,
      coords[0] + width / 2,
      coords[1] + height / 2,
    ]);
  }
}
