import { render, screen } from '@testing-library/angular';
import { DrawingComponent } from './drawing.component';
import { of } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { MenubarService } from '../../menubar';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  selectDrawingFeaturesIncludingSelected, selectHasDrawingFeatures, selectSelectedDrawingFeature, selectSelectedDrawingStyle,
} from '../state/drawing.selectors';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DrawingFeatureModel } from '../models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';
import { DrawingHelper } from '../helpers/drawing.helper';
import { DrawingStyleFormComponent } from '../drawing-style-form/drawing-style-form.component';
import { ConfirmDialogService, SharedImportsModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('DrawingComponent', () => {

  test('renders and registers', async () => {
    const mapServiceMock = {
      renderFeatures$: jest.fn(() => of(true)),
    };
    const menubarServiceMock = {
      isComponentVisible$: jest.fn(() => of(true)),
      registerComponent: jest.fn(),
    };
    const confirmServiceMock = {
      confirm$: jest.fn(() => of(true)),
    };
    const { container } = await render(DrawingComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      providers: [
        provideMockStore({ selectors: [{ selector: selectDrawingFeaturesIncludingSelected, value: [] }]}),
        { provide: MapService, useValue: mapServiceMock },
        { provide: MenubarService, useValue: menubarServiceMock },
        { provide: ConfirmDialogService, useValue: confirmServiceMock },
      ],
    });
    expect(container.querySelector('tm-create-drawing-button')).not.toBeNull();
    expect(mapServiceMock.renderFeatures$).toHaveBeenCalled();
    expect(menubarServiceMock.isComponentVisible$).toHaveBeenCalled();
    expect(menubarServiceMock.registerComponent).toHaveBeenCalled();
  });

  test('should not render contents if component is not active', async () => {
    const mapServiceMock = {
      renderFeatures$: jest.fn(() => of(true)),
    };
    const menubarServiceMock = {
      isComponentVisible$: jest.fn(() => of(false)),
      registerComponent: jest.fn(),
    };
    const confirmServiceMock = {
      confirm$: jest.fn(() => of(true)),
    };
    const { container } = await render(DrawingComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      providers: [
        provideMockStore({ selectors: [{ selector: selectDrawingFeaturesIncludingSelected, value: [] }]}),
        { provide: MapService, useValue: mapServiceMock },
        { provide: MenubarService, useValue: menubarServiceMock },
        { provide: ConfirmDialogService, useValue: confirmServiceMock },
      ],
    });
    expect(container.querySelector('tm-create-drawing-button')).toBeNull();
    expect(mapServiceMock.renderFeatures$).toHaveBeenCalled();
    expect(menubarServiceMock.isComponentVisible$).toHaveBeenCalled();
    expect(menubarServiceMock.registerComponent).toHaveBeenCalled();
  });

  test('removes all / selected features', async () => {
    const mapServiceMock = {
      renderFeatures$: jest.fn(() => of(true)),
    };
    const menubarServiceMock = {
      isComponentVisible$: jest.fn(() => of(true)),
      registerComponent: jest.fn(),
    };
    const confirmServiceMock = {
      confirm$: jest.fn(() => of(true)),
    };
    const selectedFeature: DrawingFeatureModel = { __fid: '1', geometry: '', attributes: { type: DrawingFeatureTypeEnum.POINT, style: DrawingHelper.getDefaultStyle() }};
    await render(DrawingComponent, {
      imports: [ SharedImportsModule, MatIconTestingModule ],
      declarations: [ DrawingStyleFormComponent ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      providers: [
        provideMockStore({ selectors: [
            { selector: selectDrawingFeaturesIncludingSelected, value: [] },
            { selector: selectSelectedDrawingStyle, value: null },
            { selector: selectSelectedDrawingFeature, value: selectedFeature },
            { selector: selectHasDrawingFeatures, value: true },
          ]}),
        { provide: MapService, useValue: mapServiceMock },
        { provide: MenubarService, useValue: menubarServiceMock },
        { provide: ConfirmDialogService, useValue: confirmServiceMock },
      ],
    });
    const store = TestBed.inject(MockStore);
    const mockDispatch = jest.fn();
    store.dispatch = mockDispatch;

    expect(await screen.getByText(/Fill color/)).toBeInTheDocument();

    await userEvent.click(await screen.getByText('Remove selected drawing object'));
    expect(confirmServiceMock.confirm$).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: '[Drawing] Remove Drawing Feature', fid: '1' });

    mockDispatch.mockClear();
    confirmServiceMock.confirm$.mockClear();
    await userEvent.click(await screen.getByText('Remove complete drawing'));
    expect(confirmServiceMock.confirm$).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: '[Drawing] Remove All Drawing Features' });
  });

});
