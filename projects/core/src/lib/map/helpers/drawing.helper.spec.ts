import { describe, test, expect } from 'vitest';
import { DrawingHelper } from './drawing.helper';
import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';

describe('DrawingHelper', () => {

  test('getDrawingTypeForGeometry maps single geometries', () => {
    expect(DrawingHelper.getDrawingTypeForGeometry('POINT(1 2)')).toBe(DrawingFeatureTypeEnum.POINT);
    expect(DrawingHelper.getDrawingTypeForGeometry('LINESTRING(0 0, 1 1)')).toBe(DrawingFeatureTypeEnum.LINE);
    expect(DrawingHelper.getDrawingTypeForGeometry('POLYGON((0 0, 1 0, 1 1, 0 0))')).toBe(DrawingFeatureTypeEnum.POLYGON);
  });

  test('getDrawingTypeForGeometry maps multi geometries to the type of their parts', () => {
    expect(DrawingHelper.getDrawingTypeForGeometry('MULTIPOINT((1 2), (3 4))')).toBe(DrawingFeatureTypeEnum.POINT);
    expect(DrawingHelper.getDrawingTypeForGeometry('MULTILINESTRING((0 0, 1 1), (2 2, 3 3))')).toBe(DrawingFeatureTypeEnum.LINE);
    expect(DrawingHelper.getDrawingTypeForGeometry('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 0)), ((2 2, 3 2, 3 3, 2 2)))'))
      .toBe(DrawingFeatureTypeEnum.POLYGON);
  });

  test('getDrawingTypeForGeometry returns null for unsupported geometries', () => {
    expect(DrawingHelper.getDrawingTypeForGeometry('GEOMETRYCOLLECTION(POINT(1 2), LINESTRING(0 0, 1 1))')).toBeNull();
  });

});
