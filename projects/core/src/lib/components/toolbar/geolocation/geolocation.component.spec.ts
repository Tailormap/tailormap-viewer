import { render, screen } from '@testing-library/angular';
import { GeolocationComponent } from './geolocation.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

describe('GeolocationComponent', () => {
  test('renders and properly zooms to coordinates', async () => {
    const mapService = getMapServiceMock();
    const watchPosition = jest.fn((success: PositionCallback, error: PositionErrorCallback | null | undefined) => {
        queueMicrotask(() => success({
            coords: {
                accuracy: 120,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                latitude: 52.1189998,
                longitude: 5.0429566,
                speed: null,
            },
            timestamp: 1,
        }));

        return 1;
    });

    Object.defineProperty(global.navigator, 'geolocation', { value: { watchPosition } });

    await render(GeolocationComponent, {
      providers: [mapService.provider],
      imports: [ MatIconTestingModule, SharedModule ],
    });
    const zoomToLocationBtn = screen.getByLabelText('Zoom to location');
    expect(zoomToLocationBtn).toBeInTheDocument();
    await userEvent.click(zoomToLocationBtn);
    expect(mapService.mapService.zoomTo).toHaveBeenCalled();
  });
});
