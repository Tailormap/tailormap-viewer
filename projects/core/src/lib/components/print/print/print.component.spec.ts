import { render, screen } from '@testing-library/angular';
import { PrintComponent } from './print.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { MenubarService } from '../../menubar';
import userEvent from '@testing-library/user-event';
import { MapService } from '@tailormap-viewer/map';

describe('PrintComponent', () => {

  test('should render', async () => {
    const menubarServiceMock = {
      isComponentVisible$: jest.fn(() => of(true)),
      registerComponent: jest.fn(),
    };
    const mapServiceMock = {
      exportMapImage$: jest.fn(() => of('')),
    };
    await render(PrintComponent,{
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
        providers: [
        provideMockStore(),
      ],
      componentProviders: [
        {
          provide: MatSnackBar,
          useValue: {},
        },
        { provide: MenubarService, useValue: menubarServiceMock },
        { provide: MapService, useValue: mapServiceMock },
      ],
    });
    expect(await screen.getByText('Download map image')).toBeInTheDocument();
    await userEvent.click(await screen.getByText('Download map image'));
    expect(mapServiceMock.exportMapImage$).toHaveBeenCalled();
  });

});
