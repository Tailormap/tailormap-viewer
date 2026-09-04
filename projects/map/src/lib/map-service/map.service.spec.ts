import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { MapService } from './map.service';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { HttpXsrfTokenExtractor } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { OpenLayersMap } from '../openlayers-map/openlayers-map';

// Note: `vi.mock` on relative imports is not supported by the Angular unit-test builder
// ("Please use Angular TestBed for mocking dependencies"), so OpenLayersMap is stubbed via
// vi.spyOn on its prototype instead of mocking the module.
const ngHttpXsrfTokenExtractor = {} as HttpXsrfTokenExtractor;

describe('MapService', () => {

  let initMapSpy: ReturnType<typeof vi.spyOn>;
  let renderSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    initMapSpy = vi.spyOn(OpenLayersMap.prototype, 'initMap').mockImplementation(() => {});
    renderSpy = vi.spyOn(OpenLayersMap.prototype, 'render').mockImplementation(() => {});
    vi.spyOn(OpenLayersMap.prototype, 'getLayerManager$').mockReturnValue(of({ refreshLayer: vi.fn() } as any));

    TestBed.configureTestingModule({
      providers: [
        { provide: NgZone, useFactory: () => new NgZone({}) },
        { provide: HttpXsrfTokenExtractor, useValue: ngHttpXsrfTokenExtractor },
        MapService,
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should be created', () => {
    const service = TestBed.inject(MapService);
    expect(service).toBeTruthy();
  });

  test('calls methods on map', async () => {
    const service = TestBed.inject(MapService);
    service.initMap({ maxExtent: [], projectionDefinition: 'DEF', projection: 'PROJ' });
    expect(initMapSpy).toHaveBeenCalledWith({ maxExtent: [], projectionDefinition: 'DEF', projection: 'PROJ' }, undefined);
    const el = document.createElement('div');
    service.render(el);
    expect(renderSpy).toHaveBeenCalledWith(el);
    const manager = await firstValueFrom(service.getLayerManager$());
    expect(manager).toBeDefined();
    expect(typeof manager.refreshLayer).toBe('function');
  });

});
