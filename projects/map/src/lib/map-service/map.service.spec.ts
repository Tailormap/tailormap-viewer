import { MapService } from './map.service';
import { NgZone } from '@angular/core';

const initMapFn = jest.fn();
const renderFn = jest.fn();

jest.mock('../openlayers-map/openlayers-map', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    OpenLayersMap: jest.fn().mockImplementation(() => {
      return {
        initMap: initMapFn,
        render: renderFn,
        getLayerManager$: () => true,
      };
    }),
  };
});

const ngZoneMock = {} as NgZone;

describe('MapService', () => {

  test('should be created', () => {
    expect(new MapService(ngZoneMock)).toBeTruthy();
  });

  test('calls methods on map', () => {
    const service = new MapService(ngZoneMock);
    service.initMap({ maxExtent: [], projectionDefinition: 'DEF', projection: 'PROJ' });
    expect(initMapFn).toHaveBeenCalledWith({ maxExtent: [], projectionDefinition: 'DEF', projection: 'PROJ' });
    const el = document.createElement('div');
    service.render(el);
    expect(renderFn).toHaveBeenCalledWith(el);
    expect(service.getLayerManager$()).toEqual(true);
  });

});
