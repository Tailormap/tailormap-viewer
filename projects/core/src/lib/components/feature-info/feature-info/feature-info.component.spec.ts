import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { render } from '@testing-library/angular';
import { FeatureInfoComponent } from './feature-info.component';
import { Store } from '@ngrx/store';
import { finalize, of, Subject } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';
import { FeatureInfoService } from '../feature-info.service';
import { AuthenticatedUserTestHelper } from '../../../test-helpers/authenticated-user-test.helper';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1MockService } from '@tailormap-viewer/api';
import { selectIn3dView, selectVisibleLayersWithAttributes } from '../../../map/state/map.selectors';
import { featureInfoLoaded } from '../state/feature-info.actions';
import { FeatureInfoResponseModel, emptyFeaturesResponse } from '../models/feature-info-response.model';

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

describe('FeatureInfoComponent map clicks', () => {

  type MapClick = { mapCoordinates: [number, number]; mouseCoordinates: [number, number] };

  /** Each fetchFeatures$ call returns a subject the test resolves itself; records which clicks had their requests cancelled. */
  const setupClicks = async (hasLayers = () => true) => {
    const mapClick$ = new Subject<MapClick>();
    const mapServiceMock = getMapServiceMock(tool => ({ id: tool, mapClick$ }));
    const responses: Array<Subject<FeatureInfoResponseModel>> = [];
    const cancelled: number[] = [];
    const fetchFeatures$ = vi.fn(() => {
      const idx = responses.length;
      const response = new Subject<FeatureInfoResponseModel>();
      responses.push(response);
      return response.pipe(finalize(() => {
        if (!response.closed) {
          cancelled.push(idx);
        }
      }));
    });
    const mockDispatch = vi.fn();
    await render(FeatureInfoComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        AuthenticatedUserTestHelper.provideAuthenticatedUserService(false, []),
        { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
      ],
      componentProviders: [
        mapServiceMock.provider,
        {
          provide: Store,
          useValue: {
            select: vi.fn(selector => {
              if (selector === selectIn3dView) {
                return of(false);
              }
              if (selector === selectVisibleLayersWithAttributes) {
                return of(hasLayers() ? [{ id: '1' }] : []);
              }
              return of([]);
            }),
            selectSignal: () => () => false,
            dispatch: mockDispatch,
          },
        },
        { provide: FeatureInfoService, useValue: { fetchFeatures$ } },
      ],
    });
    const click = (x: number) => mapClick$.next({ mapCoordinates: [ x, x ], mouseCoordinates: [ x, x ] });
    const respond = (idx: number, layerId: string) => {
      responses[idx].next({ ...emptyFeaturesResponse, layerId });
      responses[idx].complete();
    };
    return { click, respond, fetchFeatures$, cancelled, mockDispatch };
  };

  test('cancels the requests of the previous click', async () => {
    const { click, respond, fetchFeatures$, cancelled, mockDispatch } = await setupClicks();
    click(1);
    click(2);
    click(3);
    expect(fetchFeatures$).toHaveBeenCalledTimes(3);
    expect(fetchFeatures$).toHaveBeenLastCalledWith([ 3, 3 ], [ 3, 3 ], undefined, undefined);
    expect(cancelled).toEqual([ 0, 1 ]);
    respond(2, 'layer-3');
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(featureInfoLoaded({ featureInfo: { ...emptyFeaturesResponse, layerId: 'layer-3' } }));
  });

  test('does not cancel the requests of the previous click for a click without layers to query', async () => {
    let hasLayers = true;
    const { click, respond, fetchFeatures$, cancelled, mockDispatch } = await setupClicks(() => hasLayers);
    click(1);
    hasLayers = false;
    click(2);
    expect(fetchFeatures$).toHaveBeenCalledTimes(1);
    expect(cancelled).toEqual([]);
    respond(0, 'layer-1');
    expect(mockDispatch).toHaveBeenCalledWith(featureInfoLoaded({ featureInfo: { ...emptyFeaturesResponse, layerId: 'layer-1' } }));
  });

});
