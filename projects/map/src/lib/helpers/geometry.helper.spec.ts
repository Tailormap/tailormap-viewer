import { GeometryHelper } from './geometry.helper';

describe('GeometryHelper', () => {
  it('should create an instance', () => {
    expect(new GeometryHelper()).toBeTruthy();
  });

  describe('bufferWktGeometry', () => {
    it('should buffer a point geometry', () => {
      const pointWKT = 'POINT(0 0)';
      const bufferDistance = 1;
      const result = GeometryHelper.bufferWktGeometry(pointWKT, bufferDistance);
      // because we have a mocked-up JSTS BufferOp that returns the input we cannot check if the returned is actually a polygon
      expect(result).toBeTruthy();
    });

    it('should buffer a linestring geometry', () => {
      const linestringWKT = 'LINESTRING(0 0, 1 1, 2 0)';
      const bufferDistance = 0.5;
      const result = GeometryHelper.bufferWktGeometry(linestringWKT, bufferDistance);
      // because we have a mocked=up JSTS BufferOp that returns the input we cannot check if the returned is actually a polygon
      expect(result).toBeTruthy();
    });

    it('should buffer a polygon geometry', () => {
      const polygonWKT = 'POLYGON((0 0, 4 0, 4 4, 0 4, 0 0))';
      const bufferDistance = 1;
      const result = GeometryHelper.bufferWktGeometry(polygonWKT, bufferDistance);

      expect(result).toBeTruthy();
      expect(result).toContain('POLYGON');
    });

    it('should handle negative buffer distance (shrink geometry)', () => {
      const polygonWKT = 'POLYGON((0 0, 4 0, 4 4, 0 4, 0 0))';
      const bufferDistance = -0.5;
      const result = GeometryHelper.bufferWktGeometry(polygonWKT, bufferDistance);

      expect(result).toBeTruthy();
      expect(result).toContain('POLYGON');
    });

    it('should handle zero buffer distance', () => {
      const pointWKT = 'POINT(0 0)';
      const bufferDistance = 0;
      const result = GeometryHelper.bufferWktGeometry(pointWKT, bufferDistance);

      expect(result).toBeTruthy();
    });
  });

  describe('getCircleQueryWKT', () => {
    it('should convert circle WKT to polygon WKT', () => {
      const circleWKT = 'CIRCLE(10 20 5)';
      const result = GeometryHelper.getCircleQueryWKT(circleWKT);

      expect(result).toBeTruthy();
      expect(result).toContain('POLYGON');
    });

    it('should apply buffer to circle radius', () => {
      const circleWKT = 'CIRCLE(10 20 5)';
      const buffer = 2;
      const result = GeometryHelper.getCircleQueryWKT(circleWKT, buffer);

      expect(result).toBeTruthy();
      expect(result).toContain('POLYGON');
    });

    it('should handle circle without buffer parameter', () => {
      const circleWKT = 'CIRCLE(0 0 10)';
      const result = GeometryHelper.getCircleQueryWKT(circleWKT);

      expect(result).toBeTruthy();
      expect(result).toContain('POLYGON');
    });

    it('should handle zero buffer', () => {
      const circleWKT = 'CIRCLE(5 5 3)';
      const result = GeometryHelper.getCircleQueryWKT(circleWKT, 0);

      expect(result).toBeTruthy();
      expect(result).toContain('POLYGON');
    });

    it('should handle negative buffer (shrink radius)', () => {
      const circleWKT = 'CIRCLE(0 0 10)';
      const result = GeometryHelper.getCircleQueryWKT(circleWKT, -2);

      expect(result).toBeTruthy();
      expect(result).toContain('POLYGON');
    });

    it('should handle circles with decimal coordinates', () => {
      const circleWKT = 'CIRCLE(10.5 20.7 5.3)';
      const result = GeometryHelper.getCircleQueryWKT(circleWKT);

      expect(result).toBeTruthy();
      expect(result).toContain('POLYGON');
    });

    it('should handle negative coordinates', () => {
      const circleWKT = 'CIRCLE(-10 -20 5)';
      const result = GeometryHelper.getCircleQueryWKT(circleWKT);

      expect(result).toBeTruthy();
      expect(result).toContain('POLYGON');
    });

    it('should produce different polygons with different buffers', () => {
      const circleWKT = 'CIRCLE(10 20 5)';
      const result1 = GeometryHelper.getCircleQueryWKT(circleWKT, 0);
      const result2 = GeometryHelper.getCircleQueryWKT(circleWKT, 2);

      expect(result1).not.toEqual(result2);
    });
  });
});
