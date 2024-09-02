import { render } from '@testing-library/angular';
import { FeatureInfoComponent } from './feature-info.component';
import { Store } from '@ngrx/store';
import { loadFeatureInfo } from '../state/feature-info.actions';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

jest.useFakeTimers();

const setup = async (returnError = false) => {
  const mapServiceMock = getMapServiceMock(tool => ({
    id: tool,
    mapClick$: of({
      mapCoordinates: [ 1, 2 ],
      mouseCoordinates: [ 2, 3 ],
    }),
  }));
  const mockDispatch = jest.fn();
  const mockSelect = jest.fn(() => of('POINT(1 2)'));
  await render(FeatureInfoComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    componentProviders: [
      mapServiceMock.provider,
      {
        provide: Store,
        useValue: {
          select: mockSelect,
          dispatch: mockDispatch,
          pipe: () => returnError
            ? of({ error: 'error', errorMessage: 'Test error' })
            : of(null),
        },
      },
      {
        provide: MatSnackBar,
        useValue: {},
      },
    ],
  });
  return { mapServiceMock, mockDispatch, mockSelect };
};

describe('FeatureInfoComponent', () => {

  test('should render', async () => {
    const { mapServiceMock, mockDispatch, mockSelect } = await setup();
    expect(mapServiceMock.mapService.createTool$).toHaveBeenCalled();
    const highlightArgs = Array.from(mapServiceMock.mapService.renderFeatures$.mock.calls[0]);
    expect(highlightArgs.length).toEqual(3);
    expect(highlightArgs[0]).toEqual('feature-info-highlight-layer');

    expect(mockDispatch).toHaveBeenCalledWith(loadFeatureInfo({ mapCoordinates: [ 1, 2 ], mouseCoordinates: [ 2, 3 ] }));
    expect(mockSelect).toHaveBeenCalled();
  });

  test('renders error message', async () => {
    const mockOpen = jest.fn();
    SnackBarMessageComponent.open$ = mockOpen;
    await setup(true);
    expect(mockOpen).toHaveBeenCalled();
    expect(mockOpen.mock.calls[0][1].message).toEqual('Test error');
  });

});
