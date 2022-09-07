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

  test('gets case exact url parameter', () => {
    expect(UrlHelper.getParamCaseInsensitive(new URL('http://test/?PARAM=VALUE'), 'PARAM')).toEqual('VALUE');
  });

  test('gets case insensitive url parameter', () => {
    expect(UrlHelper.getParamCaseInsensitive(new URL('http://test/?PaRaM=VALUE'), 'PARAM')).toEqual('VALUE');
  });
});
