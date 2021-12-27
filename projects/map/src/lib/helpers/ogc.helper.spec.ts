import { OgcHelper } from './ogc.helper';

describe('OgcHelper', () => {

  test('filters OGC parameters', () => {
    expect(() => OgcHelper.filterOgcUrlParameters('123')).toThrowError(new TypeError('Invalid URL: 123'));
    expect(OgcHelper.filterOgcUrlParameters(
      'https://www.openbasiskaart.nl/mapcache/wmts/?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0',
    )).toEqual(
      'https://www.openbasiskaart.nl/mapcache/wmts/',
    );
  });

});
