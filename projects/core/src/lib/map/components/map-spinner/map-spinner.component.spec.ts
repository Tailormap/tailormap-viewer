import { render } from '@testing-library/angular';
import { MapSpinnerComponent } from './map-spinner.component';
import { of } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('MapSpinnerComponent', () => {

  test('should render', async () => {
    const mapService = { getPixelForCoordinates$: jest.fn((coords: [number, number]) => of(coords)) };
    const { container } = await render(MapSpinnerComponent, {
      providers: [
        { provide: MapService, useValue: mapService },
      ],
      componentInputs: {
        loading$: of(false),
        coordinates$: of(undefined),
      },
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    const spinner = container.querySelector<HTMLDivElement>('.spinner');
    expect(spinner).not.toBeNull();
    expect(spinner?.style.display).toEqual('none');
    expect(mapService.getPixelForCoordinates$).not.toHaveBeenCalled();
  });

  test('should render on coordinates', async () => {
    const mapService = { getPixelForCoordinates$: jest.fn((coords: [number, number]) => of(coords)) };
    const coords: [ number, number ] = [ 5, 5 ];
    const { container } = await render(MapSpinnerComponent, {
      providers: [
        { provide: MapService, useValue: mapService },
      ],
      componentInputs: {
        loading$: of(true),
        coordinates$: of(coords),
      },
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    const spinner = container.querySelector<HTMLDivElement>('.spinner');
    expect(spinner).not.toBeNull();
    expect(spinner?.style.left).toEqual('5px');
    expect(spinner?.style.top).toEqual('5px');
    expect(mapService.getPixelForCoordinates$).toHaveBeenCalledWith([ 5, 5 ]);
  });

});
