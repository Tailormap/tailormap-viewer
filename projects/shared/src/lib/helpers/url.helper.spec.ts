import { UrlHelper } from './url.helper';

describe('UrlHelper', () => {

  test('filters url', () => {
    const filtered = UrlHelper.filterUrlParameters(
      'https://www.b3partners.nl/?test1=1&test2=2&test3=50&test4=4',
      (paramName, paramValue) => {
        return paramValue === '2' || paramName === 'test4';
      });
    expect(filtered).toEqual('https://www.b3partners.nl/?test2=2&test4=4');
  });

  test('throws error on invalid URL', () => {
    expect(() => UrlHelper.filterUrlParameters('test', () => true))
      .toThrowError('Invalid URL: test');
  });

});
