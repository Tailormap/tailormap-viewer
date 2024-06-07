import { render, screen } from '@testing-library/angular';
import { CoordinateLinkWindowComponent } from './coordinate-link-window.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { of, Subject } from 'rxjs';
import { CoordinateLinkWindowConfigModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { CoordinateHelper, MapService } from '@tailormap-viewer/map';
import { registerTool } from '../state/toolbar.actions';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import userEvent from '@testing-library/user-event';

const setup = async (withConfig?: boolean) => {
  const config: CoordinateLinkWindowConfigModel | undefined = withConfig ? {
    urls: [
      { id: '1', url: 'http://test.com/#@[X],[Y],18', projection: 'EPSG:28992', alias: 'Demo' },
      { id: '2', url: 'http://test2.com/#@[lat],[lon],18', projection: 'EPSG:4326', alias: 'Demo WGS84' },
    ],
    enabled: true,
    title: 'CLW',
  } : undefined;
  const storeMock = {
    select: jest.fn(() => of(({ config }))),
    dispatch: jest.fn(),
  };
  const mapClickSubject = new Subject();
  const createToolMock = jest.fn(() => of({ tool: {
    id: 'map-click',
    mapClick$: mapClickSubject.asObservable(),
  } }));
  const mapServiceMock = {
    createTool$: createToolMock,
    getProjectionCode$: () => of('EPSG:28992'),
  };
  await render(CoordinateLinkWindowComponent, {
    imports: [ MatIconTestingModule, SharedModule ],
    providers: [
      { provide: Store, useValue: storeMock },
      { provide: MapService, useValue: mapServiceMock },
    ],
  });
  return {
    store: storeMock,
    mapService: mapServiceMock,
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
    expect(await screen.queryByRole('button')).toBeInTheDocument();
    expect(mapService.createTool$).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(registerTool({ tool: { id: ToolbarComponentEnum.COORDINATE_LINK_WINDOW, mapToolId: 'map-click' } }));
    await userEvent.click(await screen.queryByRole('button'));
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

});
