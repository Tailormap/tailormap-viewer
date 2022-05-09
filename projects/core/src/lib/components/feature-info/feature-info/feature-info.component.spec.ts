import { render } from '@testing-library/angular';
import { FeatureInfoComponent } from './feature-info.component';
import { MapClickToolConfigModel, MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { loadFeatureInfo } from '../state/feature-info.actions';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';

jest.useFakeTimers();

describe('FeatureInfoComponent', () => {

  test('should render', async () => {
    const createTool = jest.fn(() => of({
      mapClick$: of({
        mapCoordinates: [ 1, 2 ],
        mouseCoordinates: [ 2, 3 ],
      }),
    }));
    const mockDispatch = jest.fn();
    const mockSelect = jest.fn(() => of('POINT(1 2)'));
    const highlightFeaturesMock = jest.fn(() => of(null));
    await render(FeatureInfoComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      componentProviders: [
        {
          provide: MapService,
          useValue: { createTool$: createTool, renderFeatures$: highlightFeaturesMock },
        },
        {
          provide: Store,
          useValue: { select: mockSelect, dispatch: mockDispatch, pipe: () => of(null) },
        },
        {
          provide: MatSnackBar,
          useValue: {},
        },
      ],
    });

    expect(createTool).toHaveBeenCalled();
    const highlightArgs = Array.from(highlightFeaturesMock.mock.calls[0]);
    expect(highlightArgs.length).toEqual(3);
    expect(highlightArgs[0]).toEqual('feature-info-highlight-layer');

    expect(mockDispatch).toHaveBeenCalledWith(loadFeatureInfo({ mapCoordinates: [1,2], mouseCoordinates: [2,3] }));
    expect(mockSelect).toHaveBeenCalled();
  });

  test('renders error message', async () => {
    const createTool = jest.fn(() => of({
      mapClick$: of({
        mapCoordinates: [ 1, 2 ],
        mouseCoordinates: [ 2, 3 ],
      }),
    }));
    const mockDispatch = jest.fn();
    const mockSelect = jest.fn(() => of('POINT(1 2)'));
    const highlightFeaturesMock = jest.fn(() => of(null));
    const mockOpen = jest.fn();
    SnackBarMessageComponent.open$ = mockOpen;
    await render(FeatureInfoComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      componentProviders: [
        {
          provide: MapService,
          useValue: { createTool$: createTool, renderFeatures$: highlightFeaturesMock },
        },
        {
          provide: Store,
          useValue: { select: mockSelect, dispatch: mockDispatch, pipe: () => of({ error: 'error', errorMessage: 'Test error' }) },
        },
        {
          provide: MatSnackBar,
          useValue: {},
        },
      ],
    });
    expect(mockOpen).toHaveBeenCalled();
    expect(mockOpen.mock.calls[0][1].message).toEqual('Test error');
  });

});
