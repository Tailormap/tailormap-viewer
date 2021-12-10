import { ProjectionsHelper } from './projections.helper';

describe('ProjectionsHelper', () => {

  it('should return correct EPSG code', () => {
    expect(ProjectionsHelper.getRdProjection()).toEqual('EPSG:28992');
  });

  it('should transform lat/lon correctly to RD', () => {
    const xy = ProjectionsHelper.WGS84ToRD(52.1185, 5.042);
    expect(xy[0]).toBeCloseTo(131357, .5);
    expect(xy[1]).toBeCloseTo(458976, .5);
  });
});
