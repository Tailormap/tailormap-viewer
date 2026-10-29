import { describe, beforeEach, test, expect, vi, Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, of } from 'rxjs';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { DrawingCopyFeaturesService } from './drawing-copy-features.service';
import { FeatureInfoService } from '../../feature-info/feature-info.service';
import { FeatureInfoResponseModel } from '../../feature-info/models/feature-info-response.model';
import { selectVisibleLayersWithAttributes } from '../../../map/state/map.selectors';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { DrawingFeatureModel } from '../../../map/models/drawing-feature.model';
import { DrawingHelper } from '../../../map/helpers/drawing.helper';

const POLYGON = 'POLYGON((0 0, 1 0, 1 1, 0 0))';
const MULTI_POLYGON = 'MULTIPOLYGON(((0 0, 1 0, 1 1, 0 0)), ((2 2, 3 2, 3 3, 2 2)))';

const getResponse = (geometries: Array<string | undefined>, error?: string): FeatureInfoResponseModel => ({
  features: geometries.map((geometry, idx) => ({ __fid: `fid-${idx}`, geometry, attributes: { id: idx }, layerId: '1' })),
  columnMetadata: [],
  attachmentMetadata: [],
  layerId: '1',
  error,
});

describe('DrawingCopyFeaturesService', () => {

  const referenceLayer = getAppLayerModel({ id: '1', visible: true, hasAttributes: true });
  let getFeaturesForLayer$: Mock<FeatureInfoService['getFeaturesForLayer$']>;
  let service: DrawingCopyFeaturesService;
  const style = DrawingHelper.getUpdatedDefaultStyle();

  const getDrawingFeatures = (existingFeatures: DrawingFeatureModel[] = []) =>
    firstValueFrom(service.getDrawingFeaturesAt$('1', [ 1, 2 ], undefined, style, existingFeatures));

  beforeEach(() => {
    getFeaturesForLayer$ = vi.fn<FeatureInfoService['getFeaturesForLayer$']>(() => of(getResponse([POLYGON])));
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({
          selectors: [{ selector: selectVisibleLayersWithAttributes, value: [referenceLayer] }],
        }),
        { provide: FeatureInfoService, useValue: { getFeaturesForLayer$ } },
      ],
    });
    service = TestBed.inject(DrawingCopyFeaturesService);
  });

  test('returns visible layers with attributes as reference layers', async () => {
    expect(await firstValueFrom(service.getReferenceLayers$())).toEqual([referenceLayer]);
  });

  test('converts the first feature at the clicked location to a drawing feature', async () => {
    getFeaturesForLayer$.mockReturnValue(of(getResponse([ POLYGON, 'POINT(1 2)' ])));
    const result = await getDrawingFeatures();
    expect(getFeaturesForLayer$).toHaveBeenCalledWith([ 1, 2 ], '1', undefined, false);
    expect(result.features.length).toBe(1);
    expect(result.features[0].geometry).toBe(POLYGON);
    expect(result.features[0].attributes.type).toBe(DrawingFeatureTypeEnum.POLYGON);
    expect(result.features[0].attributes).not.toHaveProperty('id');
  });

  test('keeps a multi-geometry as one drawing feature', async () => {
    getFeaturesForLayer$.mockReturnValue(of(getResponse([MULTI_POLYGON])));
    const result = await getDrawingFeatures();
    expect(result.features.length).toBe(1);
    expect(result.features[0].geometry).toBe(MULTI_POLYGON);
    expect(result.features[0].attributes.type).toBe(DrawingFeatureTypeEnum.POLYGON);
  });

  test('skips features without geometry and unsupported geometry types', async () => {
    getFeaturesForLayer$.mockReturnValue(of(getResponse([undefined])));
    expect((await getDrawingFeatures()).features).toEqual([]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getFeaturesForLayer$.mockReturnValue(of(getResponse(['GEOMETRYCOLLECTION(POINT(1 2))'])));
    expect((await getDrawingFeatures()).features).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('skips a feature that is already in the drawing', async () => {
    const existing: DrawingFeatureModel = {
      __fid: 'existing',
      geometry: POLYGON,
      attributes: { type: DrawingFeatureTypeEnum.POLYGON, style },
    };
    const result = await getDrawingFeatures([existing]);
    expect(result.features).toEqual([]);
    expect(result.alreadyInDrawing).toBe(true);
  });

  test('returns the error when loading features fails', async () => {
    getFeaturesForLayer$.mockReturnValue(of(getResponse([], 'Something went wrong')));
    expect(await getDrawingFeatures()).toEqual({ features: [], error: 'Something went wrong' });
    getFeaturesForLayer$.mockReturnValue(of(null));
    expect(await getDrawingFeatures()).toEqual({ features: [] });
  });

});
