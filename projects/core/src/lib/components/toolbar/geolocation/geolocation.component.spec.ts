import { render, screen } from '@testing-library/angular';
import { GeolocationComponent } from './geolocation.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { LoadingStateEnum, SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';
import { provideMockStore } from '@ngrx/store/testing';
import { selectComponentsConfig, selectViewerLoadingState } from '../../../state/core.selectors';

describe('GeolocationComponent', () => {
  test('renders and properly zooms to coordinates', async () => {
    const mapService = getMapServiceMock();
    const watchPosition = vi.fn((success: PositionCallback, error: PositionErrorCallback | null | undefined) => {
        queueMicrotask(() => success({
            coords: {
                accuracy: 120,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                latitude: 52.1189998,
                longitude: 5.0429566,
                speed: null,
                toJSON() { return this; },
            },
            timestamp: 1,
            toJSON() { return this; },
        }));

        return 1;
    });

    Object.defineProperty(global.navigator, 'geolocation', { value: { watchPosition } });

    await render(GeolocationComponent, {
      providers: [
        mapService.provider,
        provideMockStore({
          selectors: [
            { selector: selectComponentsConfig, value: [] },
            { selector: selectViewerLoadingState, value: LoadingStateEnum.LOADED },
          ],
        }),
      ],
      imports: [ MatIconTestingModule, SharedModule ],
    });
    const zoomToLocationBtn = screen.getByLabelText('Zoom to location');
    expect(zoomToLocationBtn).toBeInTheDocument();
    await userEvent.click(zoomToLocationBtn);
    expect(mapService.mapService.zoomTo).toHaveBeenCalled();
  });
});
