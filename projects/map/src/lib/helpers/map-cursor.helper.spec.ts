import { afterEach, describe, expect, test } from 'vitest';
import { MapCursorHelper } from './map-cursor.helper';

describe('MapCursorHelper', () => {

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('adds and removes the copy cursor class on the map container', () => {
    document.body.innerHTML = '<div class="map-container"></div>';
    const el = document.querySelector('.map-container');
    MapCursorHelper.setCopyCursor(true);
    expect(el?.classList.contains('map-container--with-copy-cursor')).toBe(true);
    MapCursorHelper.setCopyCursor(false);
    expect(el?.classList.contains('map-container--with-copy-cursor')).toBe(false);
  });

  test('does nothing when there is no map container', () => {
    expect(() => MapCursorHelper.setCopyCursor(true)).not.toThrow();
  });

});
