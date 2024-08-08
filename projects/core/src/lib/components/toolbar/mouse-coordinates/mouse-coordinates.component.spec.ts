import { render, screen } from '@testing-library/angular';
import { MouseCoordinatesComponent } from './mouse-coordinates.component';
import { of } from 'rxjs';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

describe('MouseCoordinatesComponent', () => {

  test('should render', async () => {
    const mapServiceMock = getMapServiceMock(
      () => ({ mouseMove$: of({ type: 'move', mapCoordinates: [ 50, 60 ] }) }),
    );
    await render(MouseCoordinatesComponent, {
      providers: [mapServiceMock.provider],
    });
    expect(await screen.getByText('50'));
    expect(await screen.getByText('|'));
    expect(await screen.getByText('60'));
    expect(mapServiceMock.createTool$).toHaveBeenCalledTimes(1);
    expect(mapServiceMock.mapService.getRoundedCoordinates$).toHaveBeenCalledTimes(1);
  });

});
