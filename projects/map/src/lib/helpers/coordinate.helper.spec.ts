import { describe, expect, test } from 'vitest';
import { CoordinateHelper } from './coordinate.helper';

describe('CoordinateHelper', () => {

  test('projects to a known target projection that is not the map projection', () => {
    const rdCoordinates = CoordinateHelper.projectCoordinates(
      [ 5.38720621, 52.1551744 ],
      'EPSG:4326',
      'EPSG:28992',
    );

    expect(Math.abs(rdCoordinates[0] - 155000)).toBeLessThan(1);
    expect(Math.abs(rdCoordinates[1] - 463000)).toBeLessThan(1);
  });

});
