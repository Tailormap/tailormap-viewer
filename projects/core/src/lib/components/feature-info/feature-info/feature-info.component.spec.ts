import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { render } from '@testing-library/angular';
import { FeatureInfoComponent } from './feature-info.component';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';
import { FeatureInfoService } from '../feature-info.service';
import { AuthenticatedUserTestHelper } from '../../../test-helpers/authenticated-user-test.helper';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1MockService } from '@tailormap-viewer/api';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

const setup = async (returnError = false) => {
  const mapServiceMock = getMapServiceMock(tool => ({
    id: tool,
    mapClick$: of({
      mapCoordinates: [ 1, 2 ],
      mouseCoordinates: [ 2, 3 ],
    }),
  }));
  const mockDispatch = vi.fn();
  const mockSelect = vi.fn(() => of('POINT(1 2)'));
  await render(FeatureInfoComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      AuthenticatedUserTestHelper.provideAuthenticatedUserService(false, []),
      { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
      provideNoopAnimations(),
    ],
    componentProviders: [
      mapServiceMock.provider,
      {
        provide: Store,
        useValue: {
          select: mockSelect,
          selectSignal: () => () => false,
          dispatch: mockDispatch,
          pipe: () => returnError
            ? of({ error: 'error', errorMessage: 'Test error' })
            : of(null),
        },
      },
      {
        provide: FeatureInfoService,
        useValue: {
          getFeatureInfoFromApi$: vi.fn(() => []),
          getWmsGetFeatureInfo$: vi.fn(() => []),
        },
      },
    ],
  });
  return { mapServiceMock, mockDispatch, mockSelect };
};

describe('FeatureInfoComponent', () => {

  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('should render', async () => {
    const { mapServiceMock, mockSelect } = await setup();
    expect(mapServiceMock.mapService.createTool$).toHaveBeenCalled();
    const highlightArgs = Array.from(mapServiceMock.mapService.renderFeatures$.mock.calls[0]);
    expect(highlightArgs.length).toEqual(3);
    expect(highlightArgs[0]).toEqual('feature-info-highlight-layer');
    expect(mockSelect).toHaveBeenCalled();
  });

});
