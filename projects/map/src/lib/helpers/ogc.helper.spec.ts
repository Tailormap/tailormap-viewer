import { describe, test, expect } from 'vitest';
import { OgcHelper } from './ogc.helper';

describe('OgcHelper', () => {

  test('filters OGC parameters', () => {
    expect(() => OgcHelper.filterOgcUrlParameters('123')).toThrow('Invalid URL');
    expect(OgcHelper.filterOgcUrlParameters(
      'https://www.openbasiskaart.nl/mapcache/wmts/?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0',
    )).toEqual(
      'https://www.openbasiskaart.nl/mapcache/wmts/',
    );
  });

});
