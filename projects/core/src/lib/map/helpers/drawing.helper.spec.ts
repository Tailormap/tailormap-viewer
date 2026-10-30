import { describe, test, expect } from 'vitest';
import { DrawingHelper } from './drawing.helper';
import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';

describe('DrawingHelper', () => {

  test.each([
    [ 'POINT(1 2)', DrawingFeatureTypeEnum.POINT ],
    [ 'LINESTRING(0 0, 1 1)', DrawingFeatureTypeEnum.LINE ],
    [ 'POLYGON((0 0, 1 0, 1 1, 0 0))', DrawingFeatureTypeEnum.POLYGON ],
    [ 'MULTIPOINT((1 2), (3 4))', DrawingFeatureTypeEnum.POINT ],
    [ 'MULTILINESTRING((0 0, 1 1), (2 2, 3 3))', DrawingFeatureTypeEnum.LINE ],
    [ 'MULTIPOLYGON(((0 0, 1 0, 1 1, 0 0)), ((2 2, 3 2, 3 3, 2 2)))', DrawingFeatureTypeEnum.POLYGON ],
    [ 'GEOMETRYCOLLECTION(POINT(1 2), LINESTRING(0 0, 1 1))', null ],
  ])('getDrawingTypeForGeometry(%s) returns %s', (geometry, expected) => {
    expect(DrawingHelper.getDrawingTypeForGeometry(geometry)).toBe(expected);
  });

});
