import { render, screen } from '@testing-library/angular';
import { PrintComponent } from './print.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { ApplicationMapService } from '../../../map/services/application-map.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ICON_SERVICE_ICON_LOCATION, SharedImportsModule } from '@tailormap-viewer/shared';
import { APP_BASE_HREF } from '@angular/common';

describe('PrintComponent', () => {

  test('should render', async () => {
    const menubarServiceMock = {
      isComponentVisible$: jest.fn(() => of(true)),
      registerComponent: jest.fn(),
    };
    await render(PrintComponent, {
      imports: [
        HttpClientTestingModule,
        SharedImportsModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [
        provideMockStore(),
      ],
      componentProviders: [
        { provide: MatSnackBar, useValue: null },
        { provide: MenubarService, useValue: menubarServiceMock },
        { provide: ApplicationMapService, useValue: null },
        { provide: ICON_SERVICE_ICON_LOCATION, useValue: null },
        { provide: APP_BASE_HREF, useValue: null },
      ],
    });
    expect(await screen.getByText('Export map')).toBeInTheDocument();
  });

});
