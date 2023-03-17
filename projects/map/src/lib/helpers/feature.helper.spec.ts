import { Circle, Point } from 'ol/geom';
import { FeatureHelper } from './feature.helper';
import { MapUnitEnum } from '../models/map-unit.enum';
import { Projection } from 'ol/proj';
import { ProjectionsHelper } from './projections.helper';

const projection = {
  getUnits: () => MapUnitEnum.m,
} as Projection;

describe('FeatureTypesHelper', () => {

  test('checks getWKT() for point', () => {
    expect(FeatureHelper.getWKT(new Point([ 1, 2 ]), projection, false)).toBe('POINT(1 2)');
  });


  test('checks getWKT() for point max decimals for uom', () => {
    expect(FeatureHelper.getWKT(new Point([ 1, 3.12345 ]), projection, false)).toBe('POINT(1 3.12)');
  });

  test('checks getWKT() for non-standard but not linearized circle', () => {
    expect(FeatureHelper.getWKT(new Circle([ 1, 2 ], 3), projection, false)).toBe('CIRCLE(1 2 3)');
  });

  test('checks getWKT() for linearized circle', () => {
    expect(FeatureHelper.getWKT(new Circle([ 1, 2 ], 3), projection, true)).toBe(
      'POLYGON((4 2,3.94 2.59,3.77 3.15,3.49 3.67,3.12 4.12,2.67 4.49,2.15 4.77,1.59 4.94,1 5,0.41 4.94,-0.15 4.77,-0.67 4.49,-1.12 ' +
      '4.12,-1.49 3.67,-1.77 3.15,-1.94 2.59,-2 2,-1.94 1.41,-1.77 0.85,-1.49 0.33,-1.12 -0.12,-0.67 -0.49,-0.15 -0.77,0.41 -0.94,1 -1,1.59 ' +
      '-0.94,2.15 -0.77,2.67 -0.49,3.12 -0.12,3.49 0.33,3.77 0.85,3.94 1.41,4 2))');
  });

  test('checks getWKT() for non-standard but not linearized circle with maximum number of decimals for meter units of measure', () => {
    expect(FeatureHelper.getWKT(new Circle([ 1.3496582958, 3.12345 ], 3.12345), projection, false)).toBe('CIRCLE(1.35 3.12 3.12)');
  });

  test('checks transformGeometry point from EPSG:4326 to EPSG:3857', () => {
    expect(FeatureHelper.transformGeometry('POINT(1 2)', 'EPSG:4326', 'EPSG:3857')).toContain('POINT(111319.4907');
    expect(FeatureHelper.transformGeometry('POINT(1 2)', 'EPSG:4326', 'EPSG:3857')).toContain(' 222684.2085');
  });

  test('checks transformGeometry polygon from EPSG:4326 to EPSG:3857', () => {
    expect(FeatureHelper.transformGeometry('POLYGON ((1 2, 1 3, 2 3, 1 3, 1 2))', 'EPSG:4326', 'EPSG:3857')).toContain('POLYGON((111319.4907');
    expect(FeatureHelper.transformGeometry('POLYGON ((1 2, 1 3, 2 3, 1 3, 1 2))', 'EPSG:4326', 'EPSG:3857')).toContain(' 222684.2085');
  });

  test('checks transformGeometry polygon to same crs', () => {
    expect(FeatureHelper.transformGeometry('POLYGON ((1 2, 1 3, 2 3, 1 3, 1 2))', 'EPSG:3857', 'EPSG:3857')).toBe('POLYGON ((1 2, 1 3, 2 3, 1 3, 1 2))');
  });

  test('checks transformGeometry polygon from EPSG:28992 to EPSG:3857', () => {
    ProjectionsHelper.initProjection('EPSG:28992',
      // eslint-disable-next-line max-len
      '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs');
    // eslint-disable-next-line max-len
    const wktGeom = 'POLYGON ((131104 460577, 129823 461804, 129495 462130, 128732 461629, 128944 461027, 129420 460143, 129722 459834, 129823 459563, 130115 459450, 130698 458799, 130791 458756, 131164 459552, 131574 460125, 131104 460577))';
    // transformed to EPSG:3857 using postgis
    // POLYGON((560849.2581363895 6824187.345771471,558756.4678094786 6826177.236152881,558220.3448005843 6826706.020960536,
    //    556983.7628036102 6825882.722527874,557333.6419826547 6824903.165435475,558114.9992614571 6823466.3175152205,
    //    558608.5089436477 6822965.239498022,558774.9233316716 6822524.435377617,559250.4864285775 6822342.685742314,
    //    560203.2990491522 6821286.592399324,560354.787083448 6821217.268622127,560954.7970522561 6822517.280664146,
    //    561616.8607501892 6823454.284349732,560849.2581363895 6824187.345771471))
    expect(FeatureHelper.transformGeometry(wktGeom, 'EPSG:28992', 'EPSG:3857')).toContain('POLYGON((560849.2581');
    expect(FeatureHelper.transformGeometry(wktGeom, 'EPSG:28992', 'EPSG:3857')).toContain(' 6824187.345');
  });
});
