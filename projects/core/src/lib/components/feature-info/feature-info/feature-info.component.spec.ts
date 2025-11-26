import { render } from '@testing-library/angular';
import { FeatureInfoComponent } from './feature-info.component';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { FeatureInfoService } from '../feature-info.service';

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
    const { mapServiceMock, mockSelect } = await setup();
    expect(mapServiceMock.mapService.createTool$).toHaveBeenCalled();
    const highlightArgs = Array.from(mapServiceMock.mapService.renderFeatures$.mock.calls[0]);
    expect(highlightArgs.length).toEqual(3);
    expect(highlightArgs[0]).toEqual('feature-info-highlight-layer');
    expect(mockSelect).toHaveBeenCalled();
  });

});
