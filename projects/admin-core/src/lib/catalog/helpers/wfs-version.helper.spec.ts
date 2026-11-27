import { describe, expect, test } from 'vitest';
import { WfsVersionHelper } from './wfs-version.helper';

describe('WfsVersionHelper', () => {

  test.each([
    'https://service.pdok.nl/wfs?service=WFS&VERSION=1.1.0',
    'https://example.com/wfs?version=1.0.0&service=WFS',
    'https://example.com/wfs?Version=1.1.0#top',
    'https://example.com/wfs?VERSION=2.0.2',
  ])('%s is unsupported', url => {
    expect(WfsVersionHelper.isUnsupportedVersion(url)).toBe(true);
  });

  test.each([
    'https://example.com/wfs?service=WFS&VERSION=2.0.0',
    'https://example.com/wfs?service=WFS',
    'https://example.com/wfs?VERSION=',
    'https://example.com/wfs?acceptversions=1.1.0',
    'example.com/wfs?VERSION=1.1.0',
    '',
    null,
    undefined,
  ])('%s is supported', url => {
    expect(WfsVersionHelper.isUnsupportedVersion(url)).toBe(false);
  });

});
