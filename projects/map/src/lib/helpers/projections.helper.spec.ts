import { describe, test, expect } from 'vitest';
import { get as getProjection, transform } from 'ol/proj.js';
import { registerProjection } from './projections.helper';

describe('registerProjection', () => {

  test('registers a WKT definition so OpenLayers can transform with it', () => {
    // eslint-disable-next-line max-len
    const wkt = 'PROJCS["ETRS89 / UTM zone 31N",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",3],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1]]';
    registerProjection('EPSG:25831', wkt);
    expect(getProjection('EPSG:25831')).not.toBeNull();
    const [ x, y ] = transform([ 3, 0 ], 'EPSG:4326', 'EPSG:25831');
    expect(x).toBeCloseTo(500000, 0);
    expect(y).toBeCloseTo(0, 0);
  });

});
