import { render, screen } from '@testing-library/angular';
import { ClickedCoordinatesComponent } from './clicked-coordinates.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MapService } from '@tailormap-viewer/map';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';

describe('ClickedCoordinatesComponent', () => {

  test('should render', async () => {
    const createTool = jest.fn(() => of('1'));
    await render(ClickedCoordinatesComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA], providers: [{
        provide: MatSnackBar, useValue: { dismiss: jest.fn() },
      }, {
        provide: MapService, useValue: { createTool$: createTool },
      }, provideMockStore({
        selectors: [
          { selector: isActiveToolbarTool(ToolbarComponentEnum.SELECT_COORDINATES), value: true },
        ],
      }) ],
    });
    expect(createTool).toHaveBeenCalled();
    expect(screen.getByLabelText('Coordinate picker'));
  });

});
