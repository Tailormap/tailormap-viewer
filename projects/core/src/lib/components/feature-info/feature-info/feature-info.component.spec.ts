import { render } from '@testing-library/angular';
import { FeatureInfoComponent } from './feature-info.component';
import { MapClickToolModel, MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { loadFeatureInfo } from '../state/feature-info.actions';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';

describe('FeatureInfoComponent', () => {

  test('should render', async () => {
    const createTool = jest.fn(() => of('1'));
    const mockDispatch = jest.fn();
    await render(FeatureInfoComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      componentProviders: [
        {
          provide: MapService,
          useValue: { createTool$: createTool },
        },
        {
          provide: Store,
          useValue: { dispatch: mockDispatch, pipe: () => of(null) },
        },
        {
          provide: MatSnackBar,
          useValue: {},
        },
      ],
    });
    expect(createTool).toHaveBeenCalled();
    // Emulate map click
    const toolConf = createTool.mock.calls[0] as unknown as MapClickToolModel[];
    toolConf[0].onClick({ mouseCoordinates: [1,2], mapCoordinates: [2,3] });
    expect(mockDispatch).toHaveBeenCalledWith(loadFeatureInfo({ mapCoordinates: [2,3], mouseCoordinates: [1,2] }));
  });

  test('renders error message', async () => {
    const createTool = jest.fn(() => of('1'));
    const mockDispatch = jest.fn();
    const mockOpen = jest.fn();
    SnackBarMessageComponent.open$ = mockOpen;
    await render(FeatureInfoComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      componentProviders: [
        {
          provide: MapService,
          useValue: { createTool$: createTool },
        },
        {
          provide: Store,
          useValue: { dispatch: mockDispatch, pipe: () => of({ error: 'error', errorMessage: 'Test error' }) },
        },
        {
          provide: MatSnackBar,
          useValue: {},
        },
      ],
    });
    // Emulate map click
    const toolConf = createTool.mock.calls[0] as unknown as MapClickToolModel[];
    toolConf[0].onClick({ mouseCoordinates: [1,2], mapCoordinates: [2,3] });
    expect(mockOpen).toHaveBeenCalled();
    expect(mockOpen.mock.calls[0][1].message).toEqual('Test error');
  });

});
