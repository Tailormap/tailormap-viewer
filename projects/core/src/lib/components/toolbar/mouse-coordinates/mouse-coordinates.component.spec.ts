import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { MouseCoordinatesComponent } from './mouse-coordinates.component';
import { of } from 'rxjs';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';
import { provideMockStore } from '@ngrx/store/testing';
import { selectComponentsConfig, selectViewerLoadingState } from '../../../state/core.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

describe('MouseCoordinatesComponent', () => {

  test('should render legacy map coordinates when no displays are configured', async () => {
    const mapServiceMock = getMapServiceMock(
      () => ({ mouseMove$: of({ type: 'move', mapCoordinates: [ 50, 60 ] }) }),
    );
    await render(MouseCoordinatesComponent, {
      providers: [
        mapServiceMock.provider,
        provideMockStore({
          selectors: [
            { selector: selectComponentsConfig, value: [] },
            { selector: selectViewerLoadingState, value: LoadingStateEnum.LOADED },
          ],
        }),
      ],
    });
    expect(await screen.getByText('50'));
    expect(await screen.getByText('|'));
    expect(await screen.getByText('60'));
    expect(mapServiceMock.createTool$).toHaveBeenCalledTimes(1);
    expect(mapServiceMock.mapService.getRoundedCoordinates$).toHaveBeenCalledTimes(1);
  });

  test('should render multiple configured WGS84 formats', async () => {
    const mapServiceMock = getMapServiceMock(
      () => ({
        mouseMove$: of({
          type: 'move',
          mapCoordinates: [ 556597.4539663679, 6800125.454397307 ],
        }),
      }),
      'EPSG:3857',
    );

    await render(MouseCoordinatesComponent, {
      providers: [
        mapServiceMock.provider,
        provideMockStore({
          selectors: [
            {
              selector: selectComponentsConfig,
              value: [{
                type: BaseComponentTypeEnum.MOUSE_COORDINATES,
                config: {
                  enabled: true,
                  displays: [
                    { id: 'dd', label: 'WGS84', projection: 'EPSG:4326', format: 'decimal-degrees' },
                    { id: 'ddm', projection: 'EPSG:4326', format: 'degrees-decimal-minutes' },
                  ],
                },
              }],
            },
            { selector: selectViewerLoadingState, value: LoadingStateEnum.LOADED },
          ],
        }),
      ],
    });

    expect(await screen.getByText('WGS84'));
    expect(await screen.getByText('52.000000° N'));
    expect(await screen.getByText('5.000000° E'));
    expect(await screen.getByText('EPSG:4326 DDM'));
    expect(await screen.getByText("52° 00.000' N"));
    expect(await screen.getByText("005° 00.000' E"));
    expect(mapServiceMock.mapService.getRoundedCoordinates$).not.toHaveBeenCalled();
  });

});
