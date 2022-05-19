import { render, screen } from '@testing-library/angular';
import { DrawingComponent } from './drawing.component';
import { of } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { MenubarService } from '../../menubar';
import { provideMockStore } from '@ngrx/store/testing';
import { selectDrawingFeaturesIncludingSelected } from '../state/drawing.selectors';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('DrawingComponent', () => {

  test('renders and registers', async () => {
    const mapServiceMock = {
      renderFeatures$: jest.fn(() => of(true)),
    };
    const menubarServiceMock = {
      isComponentVisible$: jest.fn(() => of(true)),
      registerComponent: jest.fn(),
    };
    const { container } = await render(DrawingComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      providers: [
        provideMockStore({ selectors: [{ selector: selectDrawingFeaturesIncludingSelected, value: [] }]}),
        { provide: MapService, useValue: mapServiceMock },
        { provide: MenubarService, useValue: menubarServiceMock },
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
    const { container } = await render(DrawingComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      providers: [
        provideMockStore({ selectors: [{ selector: selectDrawingFeaturesIncludingSelected, value: [] }]}),
        { provide: MapService, useValue: mapServiceMock },
        { provide: MenubarService, useValue: menubarServiceMock },
      ],
    });
    expect(container.querySelector('tm-create-drawing-button')).toBeNull();
    expect(mapServiceMock.renderFeatures$).toHaveBeenCalled();
    expect(menubarServiceMock.isComponentVisible$).toHaveBeenCalled();
    expect(menubarServiceMock.registerComponent).toHaveBeenCalled();
  });

});
