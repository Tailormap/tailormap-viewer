import { afterEach, describe, expect, test } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { ExternalLibsLoaderHelper } from './external-libs-loader.helper';

describe('ExternalLibsLoaderHelper', () => {

  afterEach(() => {
    ExternalLibsLoaderHelper.setBaseHref('');
    document.querySelectorAll('script[src*="external-libs-loader-test"], link[href*="external-libs-loader-test"]')
      .forEach(el => el.remove());
  });

  test('adds a script tag only once for the same url when a base href is set', () => {
    ExternalLibsLoaderHelper.setBaseHref('/base/');
    ExternalLibsLoaderHelper.loadScript$('external-libs-loader-test/once.js');
    ExternalLibsLoaderHelper.loadScript$('external-libs-loader-test/once.js');
    const scripts = document.querySelectorAll('script[src*="external-libs-loader-test/once.js"]');
    expect(scripts.length).toBe(1);
    expect(scripts[0].getAttribute('src')).toBe('/base/external-libs-loader-test/once.js');
  });

  test('emits true for later callers after the script has loaded', async () => {
    ExternalLibsLoaderHelper.setBaseHref('/');
    ExternalLibsLoaderHelper.loadScript$('external-libs-loader-test/loaded.js');
    const script = document.querySelector<HTMLScriptElement>('script[src*="external-libs-loader-test/loaded.js"]');
    script?.onload?.(new Event('load'));
    expect(await firstValueFrom(ExternalLibsLoaderHelper.loadScript$('external-libs-loader-test/loaded.js'))).toBe(true);
  });

  test('adds a link tag for css', () => {
    ExternalLibsLoaderHelper.loadScript$('external-libs-loader-test/style.css');
    const link = document.querySelector('link[href*="external-libs-loader-test/style.css"]');
    expect(link).toBeInTheDocument();
    expect(link?.getAttribute('rel')).toBe('stylesheet');
  });

});
