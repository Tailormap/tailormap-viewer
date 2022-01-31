import { render } from '@testing-library/angular';
import { FeatureInfoComponent } from './feature-info.component';
import { MapClickToolModel, MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { loadFeatureInfo } from '../state/feature-info.actions';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

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
          useValue: { dispatch: mockDispatch },
        },
      ],
    });
    expect(createTool).toHaveBeenCalled();
    // Emulate map click
    const toolConf = createTool.mock.calls[0] as unknown as MapClickToolModel[];
    toolConf[0].onClick({ mouseCoordinates: [1,2], mapCoordinates: [2,3] });
    expect(mockDispatch).toHaveBeenCalledWith(loadFeatureInfo({ mapCoordinates: [2,3], mouseCoordinates: [1,2] }));
  });

});
