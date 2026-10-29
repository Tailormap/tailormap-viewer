import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of, Subject, throwError } from 'rxjs';
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
    enableCopyFromLayer: vi.fn(() => copyFromLayerActive.set(true)),
    disableCopyFromLayer: vi.fn(() => copyFromLayerActive.set(false)),
  };
  const drawingCopyFeaturesServiceMock = {
    getReferenceLayers$: vi.fn(() => of([
      getAppLayerModel({ id: '1', title: 'Parcels' }),
      getAppLayerModel({ id: '2', title: 'Buildings' }),
    ])),
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
  return { drawingServiceMock, drawingCopyFeaturesServiceMock, dispatch, selectLayerAndStartCopying, clickMap };
};

describe('DrawingCopyFromLayerComponent', () => {

  test('enables the copy button only after selecting a layer', async () => {
    await setup();
    expect(screen.getByText('Get objects from reference layer')).toBeInTheDocument();
    expect(screen.getByLabelText(BUTTON_LABEL)).toBeDisabled();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText('Parcels'));
    expect(screen.getByLabelText(BUTTON_LABEL)).toBeEnabled();
  });

  test('toggles copy mode', async () => {
    const { drawingServiceMock, selectLayerAndStartCopying } = await setup();
    await selectLayerAndStartCopying();
    expect(drawingServiceMock.enableCopyFromLayer).toHaveBeenCalled();
    await userEvent.click(screen.getByLabelText(BUTTON_LABEL));
    expect(drawingServiceMock.disableCopyFromLayer).toHaveBeenCalled();
  });

  test('exposes copy mode state with aria-pressed', async () => {
    const { selectLayerAndStartCopying } = await setup();
    expect(screen.getByLabelText(BUTTON_LABEL)).toHaveAttribute('aria-pressed', 'false');
    await selectLayerAndStartCopying();
    expect(screen.getByLabelText(BUTTON_LABEL)).toHaveAttribute('aria-pressed', 'true');
  });

  test('adds copied features to the drawing on map click', async () => {
    const { drawingCopyFeaturesServiceMock, dispatch, selectLayerAndStartCopying, clickMap } = await setup();
    await selectLayerAndStartCopying();
    clickMap();
    expect(drawingCopyFeaturesServiceMock.getDrawingFeaturesAt$)
      .toHaveBeenCalledWith('1', [ 1, 2 ], 'mouse', DrawingHelper.getUpdatedDefaultStyle(), []);
    expect(dispatch).toHaveBeenCalledWith({ type: '[Drawing] Add Features', features: [copiedFeature] });
  });

  test('ignores map clicks when copy mode is not active', async () => {
    const { drawingCopyFeaturesServiceMock, clickMap } = await setup();
    clickMap();
    expect(drawingCopyFeaturesServiceMock.getDrawingFeaturesAt$).not.toHaveBeenCalled();
  });

  test('shows a message when no objects are found', async () => {
    const openSnackBar = vi.spyOn(SnackBarMessageComponent, 'open$').mockReturnValue(of());
    const { dispatch, selectLayerAndStartCopying, clickMap } = await setup({ features: [] });
    await selectLayerAndStartCopying();
    clickMap();
    expect(dispatch).not.toHaveBeenCalled();
    expect(openSnackBar).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ message: 'No objects found at this location' }));
    openSnackBar.mockRestore();
  });

  test('does not show a message when the object is already in the drawing', async () => {
    const openSnackBar = vi.spyOn(SnackBarMessageComponent, 'open$').mockReturnValue(of());
    const { selectLayerAndStartCopying, clickMap } = await setup({ features: [], alreadyInDrawing: true });
    await selectLayerAndStartCopying();
    clickMap();
    expect(openSnackBar).not.toHaveBeenCalled();
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
