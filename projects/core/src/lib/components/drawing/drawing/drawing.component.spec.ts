import { render, screen } from '@testing-library/angular';
import { DrawingComponent } from './drawing.component';
import { of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  selectDrawingFeaturesForMapRendering, selectHasDrawingFeatures, selectSelectedDrawingFeature, selectSelectedDrawingType,
} from '../state/drawing.selectors';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DrawingFeatureModel } from '../models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { DrawingHelper } from '../helpers/drawing.helper';
import { DrawingStyleFormComponent } from '../drawing-style-form/drawing-style-form.component';
import { ConfirmDialogService, SharedDirectivesModule, SharedImportsModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { createMapServiceMock } from '../../../map/components/map-drawing-buttons/map-drawing-buttons.component.spec';
import { DrawingStylesService } from '../services/drawing-styles.service';

const setup = async (isComponentVisible = true, selectors: any[] = []) => {
  const mapServiceMock = createMapServiceMock();
  const menubarServiceMock = {
    isComponentVisible$: jest.fn(() => of(isComponentVisible)),
    registerComponent: jest.fn(),
    deregisterComponent: jest.fn(),
  };
  const drawingStylesServiceMock = {
    getDrawingStyles$: jest.fn(() => of([])),
    setSelectedDrawingStyle: jest.fn(() => undefined),
  };
  const confirmServiceMock = {
    confirm$: jest.fn(() => of(true)),
  };
  const { container } = await render(DrawingComponent, {
    imports: [ SharedImportsModule, SharedDirectivesModule, MatIconTestingModule ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [DrawingStyleFormComponent],
    providers: [
      provideMockStore({ selectors: [{ selector: selectDrawingFeaturesForMapRendering, value: [] }, ...selectors ] }),
      mapServiceMock.provider,
      { provide: MenubarService, useValue: menubarServiceMock },
      { provide: ConfirmDialogService, useValue: confirmServiceMock },
      { provide: DrawingStylesService, useValue: drawingStylesServiceMock },
    ],
  });
  return { container, mapServiceMock, menubarServiceMock, confirmServiceMock };
};

describe('DrawingComponent', () => {

  test('renders and registers', async () => {
    const { mapServiceMock, menubarServiceMock } = await setup();
    expect(screen.queryByLabelText('Draw point')).not.toBeNull();
    expect(mapServiceMock.mapService.renderFeatures$).toHaveBeenCalled();
    expect(menubarServiceMock.isComponentVisible$).toHaveBeenCalled();
    expect(menubarServiceMock.registerComponent).toHaveBeenCalled();
  });

  test('should not render contents if component is not active', async () => {
    const { mapServiceMock, menubarServiceMock } = await setup(false);
    expect(screen.queryByLabelText('Draw point')).toBeNull();
    expect(mapServiceMock.mapService.renderFeatures$).toHaveBeenCalled();
    expect(menubarServiceMock.isComponentVisible$).toHaveBeenCalled();
    expect(menubarServiceMock.registerComponent).toHaveBeenCalled();
  });

  test('removes all / selected features', async () => {
    const selectedFeature: DrawingFeatureModel = { __fid: '1', geometry: '', attributes: { type: DrawingFeatureTypeEnum.POINT, style: DrawingHelper.getDefaultStyle() } };
    const { confirmServiceMock } = await setup(true, [
      { selector: selectSelectedDrawingType, value: null },
      { selector: selectSelectedDrawingFeature, value: selectedFeature },
      { selector: selectHasDrawingFeatures, value: true },
    ]);
    const store = TestBed.inject(MockStore);
    const mockDispatch = jest.fn();
    store.dispatch = mockDispatch;

    expect(await screen.getByText(/Fill color/)).toBeInTheDocument();

    await userEvent.click(await screen.getByLabelText('Delete selected drawing object'));
    expect(confirmServiceMock.confirm$).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: '[Drawing] Remove Drawing Feature', fid: '1' });

    mockDispatch.mockClear();
    confirmServiceMock.confirm$.mockClear();
    await userEvent.click(await screen.getByLabelText('Delete complete drawing'));
    expect(confirmServiceMock.confirm$).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: '[Drawing] Remove All Drawing Features' });
  });

});
