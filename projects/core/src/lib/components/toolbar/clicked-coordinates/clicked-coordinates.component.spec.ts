import { render, screen } from '@testing-library/angular';
import { ClickedCoordinatesComponent } from './clicked-coordinates.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MapService } from '@tailormap-viewer/map';
import { of } from 'rxjs';

describe('ClickedCoordinatesComponent', () => {

  test('should render', async () => {
    const createTool = jest.fn(() => of('1'));
    await render(ClickedCoordinatesComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA], componentProviders: [{
        provide: MatSnackBar, useValue: {},
      }, {
        provide: MapService, useValue: {createTool$: createTool},
      }],
    });

    expect(createTool).toHaveBeenCalled();

    expect(screen.getByLabelText('Coordinate picker'));
  });

});
