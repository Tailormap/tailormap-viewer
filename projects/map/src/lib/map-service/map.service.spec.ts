import { MapService } from './map.service';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';

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

describe('MapService', () => {
  let spectator: SpectatorService<MapService>;
  const createService = createServiceFactory(MapService);

  beforeEach(() => spectator = createService());

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('calls methods on map', () => {
    spectator.service.initMap({ maxExtent: [], projectionDefinition: 'DEF', projection: 'PROJ' });
    expect(initMapFn).toHaveBeenCalledWith({ maxExtent: [], projectionDefinition: 'DEF', projection: 'PROJ' });
    const el = document.createElement('div');
    spectator.service.render(el);
    expect(renderFn).toHaveBeenCalledWith(el);
    expect(spectator.service.getLayerManager$()).toEqual(true);
  });

});
