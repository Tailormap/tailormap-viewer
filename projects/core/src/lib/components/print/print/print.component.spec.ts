import { render, screen } from '@testing-library/angular';
import { PrintComponent } from './print.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { ApplicationMapService } from '../../../map/services/application-map.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ICON_SERVICE_ICON_LOCATION, SharedImportsModule } from '@tailormap-viewer/shared';
import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { TailormapApiConstants } from '@tailormap-viewer/api';

describe('PrintComponent', () => {

  test('should render', async () => {
    const menubarServiceMock = {
      isComponentVisible$: jest.fn(() => of(true)),
      registerComponent: jest.fn(),
      getPanelWidth$: jest.fn(() => of(300)),
      deregisterComponent: jest.fn(),
    };
    await render(PrintComponent, {
      imports: [
        SharedImportsModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideHttpClient(
          withXsrfConfiguration({
            cookieName: TailormapApiConstants.XSRF_COOKIE_NAME,
            headerName: TailormapApiConstants.XSRF_HEADER_NAME,
          }),
        ),
        provideHttpClientTesting(),
        provideMockStore(),
      ],
      componentProviders: [
        { provide: MatSnackBar, useValue: null },
        { provide: MenubarService, useValue: menubarServiceMock },
        { provide: ApplicationMapService, useValue: { selectOrderedVisibleLayersWithFilters$: () => of([]) } },
        { provide: ICON_SERVICE_ICON_LOCATION, useValue: null },
        { provide: APP_BASE_HREF, useValue: null },
      ],
    });
    expect(await screen.getByText('No visible layers.')).toBeInTheDocument();
  });

});
