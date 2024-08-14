import { render } from '@testing-library/angular';
import { MapSpinnerComponent } from './map-spinner.component';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

const setup = async (loading: boolean, coordinates?: [ number, number ]) => {
  const mapServiceMock = getMapServiceMock();
  const { container } = await render(MapSpinnerComponent, {
    providers: [mapServiceMock.provider],
    inputs: {
      loading$: of(loading),
      coordinates$: of(coordinates),
    },
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
  });
  return { container, mapServiceMock };
};

describe('MapSpinnerComponent', () => {

  test('should render', async () => {
    const { container, mapServiceMock } = await setup(false);
    const spinner = container.querySelector<HTMLDivElement>('.spinner');
    expect(spinner).not.toBeNull();
    expect(spinner?.style.display).toEqual('none');
    expect(mapServiceMock.mapService.getPixelForCoordinates$).not.toHaveBeenCalled();
  });

  test('should render on coordinates', async () => {
    const { container, mapServiceMock } = await setup(true, [ 5, 5 ]);
    const spinner = container.querySelector<HTMLDivElement>('.spinner');
    expect(spinner).not.toBeNull();
    expect(spinner?.style.left).toEqual('5px');
    expect(spinner?.style.top).toEqual('5px');
    expect(mapServiceMock.mapService.getPixelForCoordinates$).toHaveBeenCalledWith([ 5, 5 ]);
  });

});
