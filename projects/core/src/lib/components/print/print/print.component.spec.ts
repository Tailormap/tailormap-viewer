import { render, screen } from '@testing-library/angular';
import { PrintComponent } from './print.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { ApplicationMapService } from '../../../map/services/application-map.service';

describe('PrintComponent', () => {

  test('should render', async () => {
    const menubarServiceMock = {
      isComponentVisible$: jest.fn(() => of(true)),
      registerComponent: jest.fn(),
    };
    await render(PrintComponent,{
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
        providers: [
        provideMockStore(),
      ],
      componentProviders: [
        { provide: MatSnackBar, useValue: null },
        { provide: MenubarService, useValue: menubarServiceMock },
        { provide: ApplicationMapService, useValue: null },
      ],
    });
    expect(await screen.getByText('Download map image')).toBeInTheDocument();
  });

});
