import { render } from '@testing-library/angular';
import { FeatureInfoComponent } from './feature-info.component';
import { Store } from '@ngrx/store';
import { loadFeatureInfo } from '../state/feature-info.actions';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { FeatureInfoService } from '../feature-info.service';
import { registerTool } from '../../toolbar/state/toolbar.actions';
import { ToolbarComponentEnum } from '../../toolbar/models/toolbar-component.enum';

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
        provide: FeatureInfoService,
        useValue: {
          getFeatureInfoFromApi$: jest.fn(() => []),
          getWmsGetFeatureInfo$: jest.fn(() => []),
        },
      },
    ],
  });
  return { mapServiceMock, mockDispatch, mockSelect };
};

describe('FeatureInfoComponent', () => {

  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  test('should render', async () => {
    const { mapServiceMock, mockDispatch, mockSelect } = await setup();
    expect(mapServiceMock.mapService.createTool$).toHaveBeenCalled();
    const highlightArgs = Array.from(mapServiceMock.mapService.renderFeatures$.mock.calls[0]);
    expect(highlightArgs.length).toEqual(3);
    expect(highlightArgs[0]).toEqual('feature-info-highlight-layer');

    expect(mockDispatch).toHaveBeenCalledWith(registerTool({ tool: { id: ToolbarComponentEnum.FEATURE_INFO, mapToolId: 'MapClick' } }));
    expect(mockSelect).toHaveBeenCalled();
  });

});
