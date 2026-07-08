import { render, screen } from '@testing-library/angular';
import { CoordinateLinkWindowComponent } from './coordinate-link-window.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { of, Subject } from 'rxjs';
import { CoordinateLinkWindowConfigModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { CoordinateHelper } from '@tailormap-viewer/map';
import userEvent from '@testing-library/user-event';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

const setup = async (withConfig?: boolean) => {
  const config: CoordinateLinkWindowConfigModel | undefined = withConfig ? {
    urls: [
      { id: '1', url: 'http://test.com/#@[X],[Y],18', projection: 'EPSG:28992', alias: 'Demo' },
      { id: '2', url: 'http://test2.com/#@[lat],[lon],18', projection: 'EPSG:4326', alias: 'Demo WGS84' },
      { id: '3', url: 'http://test3.com/dir/[GPS-lat],[GPS-lon]/[lat],[lon]', projection: 'EPSG:4326', alias: 'Demo GPS' },
    ],
    enabled: true,
    title: 'CLW',
  } : undefined;
  const storeMock = {
    select: jest.fn(() => of(({ config }))),
    dispatch: jest.fn(),
  };
  const mapClickSubject = new Subject();
  const mapServiceMock = getMapServiceMock(tool => ({
    id: 'map-click',
    mapClick$: mapClickSubject.asObservable(),
  }), 'EPSG:28992');
  await render(CoordinateLinkWindowComponent, {
    imports: [ MatIconTestingModule, SharedModule ],
    providers: [
      { provide: Store, useValue: storeMock },
      mapServiceMock.provider,
    ],
  });
  return {
    store: storeMock,
    mapService: mapServiceMock.mapService,
    simulateMapClick: () => {
      mapClickSubject.next({ mapCoordinates: [ 130781, 459200 ] });
    },
  };
};

describe('CoordinateLinkWindowComponent', () => {

  test('should render nothing without config', async () => {
    const { mapService } = await setup();
    expect(mapService.createTool$).not.toHaveBeenCalled();
    expect(await screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('should render button and open window on map click', async () => {
    // override window.open and projectCoordinates
    const projectCoordinates = CoordinateHelper.projectCoordinates;
    CoordinateHelper.projectCoordinates = jest.fn((mapCoordinates, mapProjection, targetProjection) => {
      if (targetProjection === 'EPSG:4326') {
        return [ 52, 52 ];
      }
      return mapCoordinates;
    });
    const windowOpen = window.open;
    window.open = jest.fn();
    // run tests
    const { mapService, store, simulateMapClick } = await setup(true);
    expect(await screen.findByRole('button')).toBeInTheDocument();
    expect(mapService.createTool$).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
    simulateMapClick();
    expect(window.open).toHaveBeenCalledWith(
      'http://test.com/#@130781,459200,18', '_blank', 'popup=1, noopener, noreferrer',
    );
    await userEvent.click(await screen.findByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Demo WGS84' }));
    simulateMapClick();
    expect(window.open).toHaveBeenCalledWith(
      'http://test2.com/#@52,52,18', '_blank', 'popup=1, noopener, noreferrer',
    );
    // restore window.open and projectCoordinates
    window.open = windowOpen;
    CoordinateHelper.projectCoordinates = projectCoordinates;
  });

  test('should open window with GPS and click coordinates on map click', async () => {
    const projectCoordinates = CoordinateHelper.projectCoordinates;
    CoordinateHelper.projectCoordinates = jest.fn((mapCoordinates, mapProjection, targetProjection) => {
      if (targetProjection === 'EPSG:4326') {
        return [ 52, 52 ];
      }
      return mapCoordinates;
    });
    const windowOpen = window.open;
    window.open = jest.fn();
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: jest.fn((success: (pos: { coords: { latitude: number; longitude: number } }) => void) =>
          success({ coords: { latitude: 51.9, longitude: 4.5 } })) },
      configurable: true,
    });

    const { simulateMapClick } = await setup(true);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(await screen.findByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Demo GPS' }));
    simulateMapClick();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(window.open).toHaveBeenCalledWith(
      'http://test3.com/dir/51.9,4.5/52,52', '_blank', 'popup=1, noopener, noreferrer',
    );

    window.open = windowOpen;
    CoordinateHelper.projectCoordinates = projectCoordinates;
  });

});
