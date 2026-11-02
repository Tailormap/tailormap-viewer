import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { MapClickEvent } from '@tailormap-viewer/map';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';
import { DrawingCopyFromLayerComponent } from './drawing-copy-from-layer.component';
import { DrawingService } from '../../../map/services/drawing.service';
import { CopiedDrawingFeaturesResult, DrawingCopyFeaturesService } from '../services/drawing-copy-features.service';
import { selectDrawingFeatures } from '../state/drawing.selectors';
import { DrawingHelper } from '../../../map/helpers/drawing.helper';
import { DrawingFeatureModel } from '../../../map/models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';

const BUTTON_LABEL = 'Click objects on the map to copy them to the drawing';

const copiedFeature: DrawingFeatureModel = {
  __fid: 'copied-1',
  geometry: 'POLYGON((0 0, 1 0, 1 1, 0 0))',
  attributes: { type: DrawingFeatureTypeEnum.POLYGON, style: DrawingHelper.getUpdatedDefaultStyle() },
};

const setup = async (copyResult: CopiedDrawingFeaturesResult = { features: [copiedFeature] }) => {
  const mapClick = new Subject<MapClickEvent>();
  const copyFromLayerActive = signal(false);
  const drawingServiceMock = {
    copyFromLayerActive,
    copyFeaturesClicked$: mapClick.asObservable(),
    style: signal(DrawingHelper.getUpdatedDefaultStyle()),
    lockedStyle: signal(false),
    enableCopyFromLayer: vi.fn(() => copyFromLayerActive.set(true)),
    disableCopyFromLayer: vi.fn(() => copyFromLayerActive.set(false)),
  };
  const referenceLayers = new BehaviorSubject([
    getAppLayerModel({ id: '1', title: 'Parcels' }),
    getAppLayerModel({ id: '2', title: 'Buildings' }),
  ]);
  const drawingCopyFeaturesServiceMock = {
    getReferenceLayers$: vi.fn(() => referenceLayers.asObservable()),
    getDrawingFeaturesAt$: vi.fn(() => of(copyResult)),
  };
  await render(DrawingCopyFromLayerComponent, {
    providers: [
      provideMockStore({
        selectors: [{ selector: selectDrawingFeatures, value: [] }],
      }),
      { provide: DrawingService, useValue: drawingServiceMock },
      { provide: DrawingCopyFeaturesService, useValue: drawingCopyFeaturesServiceMock },
    ],
  });
  const store = TestBed.inject(MockStore);
  const dispatch = vi.spyOn(store, 'dispatch');
  const selectLayerAndStartCopying = async () => {
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText('Parcels'));
    await userEvent.click(screen.getByLabelText(BUTTON_LABEL));
  };
  const clickMap = () => mapClick.next({ mapCoordinates: [ 1, 2 ], mouseCoordinates: [ 3, 4 ], pointerType: 'mouse' });
  return { drawingServiceMock, drawingCopyFeaturesServiceMock, referenceLayers, dispatch, selectLayerAndStartCopying, clickMap };
};

describe('DrawingCopyFromLayerComponent', () => {

  test('toggles copy mode after selecting a layer', async () => {
    const { drawingServiceMock, selectLayerAndStartCopying } = await setup();
    expect(screen.getByLabelText(BUTTON_LABEL)).toBeDisabled();
    expect(screen.getByLabelText(BUTTON_LABEL)).toHaveAttribute('aria-pressed', 'false');
    await selectLayerAndStartCopying();
    expect(drawingServiceMock.enableCopyFromLayer).toHaveBeenCalled();
    expect(screen.getByLabelText(BUTTON_LABEL)).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByLabelText(BUTTON_LABEL));
    expect(drawingServiceMock.disableCopyFromLayer).toHaveBeenCalled();
  });

  test('adds copied features to the drawing on map click', async () => {
    const { drawingCopyFeaturesServiceMock, dispatch, selectLayerAndStartCopying, clickMap } = await setup();
    await selectLayerAndStartCopying();
    clickMap();
    expect(drawingCopyFeaturesServiceMock.getDrawingFeaturesAt$)
      .toHaveBeenCalledWith('1', [ 1, 2 ], 'mouse', DrawingHelper.getUpdatedDefaultStyle(), [], {});
    expect(dispatch).toHaveBeenCalledWith({ type: '[Drawing] Add Features', features: [copiedFeature] });
  });

  test('locks the style of copied features when the style is locked', async () => {
    const { drawingServiceMock, drawingCopyFeaturesServiceMock, selectLayerAndStartCopying, clickMap } = await setup();
    drawingServiceMock.lockedStyle.set(true);
    await selectLayerAndStartCopying();
    clickMap();
    expect(drawingCopyFeaturesServiceMock.getDrawingFeaturesAt$)
      .toHaveBeenCalledWith('1', [ 1, 2 ], 'mouse', DrawingHelper.getUpdatedDefaultStyle(), [], { lockedStyle: true });
  });

  test('clears the selected layer and stops copying when the layer is no longer available', async () => {
    const { drawingServiceMock, referenceLayers, selectLayerAndStartCopying } = await setup();
    await selectLayerAndStartCopying();
    referenceLayers.next([getAppLayerModel({ id: '2', title: 'Buildings' })]);
    TestBed.tick();
    expect(drawingServiceMock.disableCopyFromLayer).toHaveBeenCalled();
    expect(screen.getByLabelText(BUTTON_LABEL)).toBeDisabled();
  });

  test('shows a message when no objects are found', async () => {
    const openSnackBar = vi.spyOn(SnackBarMessageComponent, 'open$').mockReturnValue(of());
    const { selectLayerAndStartCopying, clickMap } = await setup({ features: [] });
    await selectLayerAndStartCopying();
    clickMap();
    expect(openSnackBar).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ message: 'No objects found at this location' }));
    openSnackBar.mockRestore();
  });

  test('keeps handling map clicks after an error', async () => {
    const openSnackBar = vi.spyOn(SnackBarMessageComponent, 'open$').mockReturnValue(of());
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { drawingCopyFeaturesServiceMock, dispatch, selectLayerAndStartCopying, clickMap } = await setup();
    drawingCopyFeaturesServiceMock.getDrawingFeaturesAt$.mockReturnValueOnce(throwError(() => new Error('Failed')));
    await selectLayerAndStartCopying();
    clickMap();
    expect(openSnackBar).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ message: 'Could not copy objects from the layer' }));
    expect(dispatch).not.toHaveBeenCalled();
    clickMap();
    expect(dispatch).toHaveBeenCalledWith({ type: '[Drawing] Add Features', features: [copiedFeature] });
    openSnackBar.mockRestore();
    consoleError.mockRestore();
  });

});
