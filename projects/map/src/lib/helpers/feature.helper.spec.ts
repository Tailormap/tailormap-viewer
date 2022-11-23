import { Circle, Point } from 'ol/geom';
import { FeatureHelper } from './feature.helper';
import { MapUnitEnum } from '../models/map-unit.enum';
import OlMap from 'ol/Map';

const map = {
  getView: () => ({
    getProjection: () => ({
      getUnits: () => MapUnitEnum.m,
    }),
  }),
} as OlMap;

describe('FeatureTypesHelper', () => {

  test('checks getWKT() for point', () => {
    expect(FeatureHelper.getWKT(new Point([ 1, 2 ]), map, false)).toBe('POINT(1 2)');
  });


  test('checks getWKT() for point max decimals for uom', () => {
    expect(FeatureHelper.getWKT(new Point([ 1, 3.12345 ]), map, false)).toBe('POINT(1 3.12)');
  });

  test('checks getWKT() for non-standard but not linearized circle', () => {
    expect(FeatureHelper.getWKT(new Circle([ 1, 2 ], 3), map, false)).toBe('CIRCLE(1 2 3)');
  });

  test('checks getWKT() for linearized circle', () => {
    expect(FeatureHelper.getWKT(new Circle([ 1, 2 ], 3), map, true)).toBe(
      'POLYGON((4 2,3.94 2.59,3.77 3.15,3.49 3.67,3.12 4.12,2.67 4.49,2.15 4.77,1.59 4.94,1 5,0.41 4.94,-0.15 4.77,-0.67 4.49,-1.12 ' +
      '4.12,-1.49 3.67,-1.77 3.15,-1.94 2.59,-2 2,-1.94 1.41,-1.77 0.85,-1.49 0.33,-1.12 -0.12,-0.67 -0.49,-0.15 -0.77,0.41 -0.94,1 -1,1.59 ' +
      '-0.94,2.15 -0.77,2.67 -0.49,3.12 -0.12,3.49 0.33,3.77 0.85,3.94 1.41,4 2))');
  });

  test('checks getWKT() for non-standard but not linearized circle with maximum number of decimals for meter units of measure', () => {
    expect(FeatureHelper.getWKT(new Circle([ 1.3496582958, 3.12345 ], 3.12345), map, false)).toBe('CIRCLE(1.35 3.12 3.12)');
  });
});
