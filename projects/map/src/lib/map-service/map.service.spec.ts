import { MapService } from './map.service';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { HttpXsrfTokenExtractor } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';

const initMapFn = vi.fn();
const renderFn = vi.fn();

vi.mock('../openlayers-map/openlayers-map', () => {
  return {
    //eslint-disable-next-line @typescript-eslint/naming-convention
    OpenLayersMap: vi.fn().mockImplementation(() => {
      return {
        initMap: initMapFn,
        render: renderFn,
        getLayerManager$: () => of({ refreshLayer: vi.fn() }),
      };
    }),
  };
});

const ngHttpXsrfTokenExtractor = {} as HttpXsrfTokenExtractor;

describe('MapService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: NgZone, useFactory: () => new NgZone({}) },
        { provide: HttpXsrfTokenExtractor, useValue: ngHttpXsrfTokenExtractor },
        MapService,
      ],
    });
  });

  test('should be created', () => {
    const service = TestBed.inject(MapService);
    expect(service).toBeTruthy();
  });

  test('calls methods on map', async () => {
    const service = TestBed.inject(MapService);
    service.initMap({ maxExtent: [], projectionDefinition: 'DEF', projection: 'PROJ' });
    expect(initMapFn).toHaveBeenCalledWith({ maxExtent: [], projectionDefinition: 'DEF', projection: 'PROJ' }, undefined);
    const el = document.createElement('div');
    service.render(el);
    expect(renderFn).toHaveBeenCalledWith(el);
    const manager = await firstValueFrom(service.getLayerManager$());
    expect(manager).toBeDefined();
    expect(typeof manager.refreshLayer).toBe('function');
  });

});
