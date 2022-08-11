import { render, screen } from '@testing-library/angular';
import { MouseCoordinatesComponent } from './mouse-coordinates.component';
import { MapService } from '@tailormap-viewer/map';
import { of } from 'rxjs';

describe('MouseCoordinatesComponent', () => {

  test('should render', async () => {
    const mapServiceMock = {
      createTool$: jest.fn(() => of({ tool: {
        mouseMove$: of({ type: 'move', mapCoordinates: [ 50, 60 ] }),
      } })),
      getRoundedCoordinates$: jest.fn(coords => of(coords)),
    };
    await render(MouseCoordinatesComponent, {
      providers: [
        { provide: MapService, useValue: mapServiceMock },
      ],
    });
    expect(await screen.getByText('50'));
    expect(await screen.getByText('|'));
    expect(await screen.getByText('60'));
    expect(mapServiceMock.createTool$).toHaveBeenCalledTimes(1);
    expect(mapServiceMock.getRoundedCoordinates$).toHaveBeenCalledTimes(1);
  });

});
