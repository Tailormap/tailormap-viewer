import { render, screen } from '@testing-library/angular';
import { ApplicationPageComponent } from './application-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { ApplicationListComponent } from '../../application/application-list/application-list.component';
import { ENVIRONMENT_CONFIG } from '@tailormap-viewer/api';
import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';
import { of } from 'rxjs';
const initialState = {
  //eslint-disable-next-line @typescript-eslint/naming-convention
  'admin-application': {
    applicationsLoadStatus: 'IDLE',
  },
};

describe('ApplicationPageComponent', () => {
  test('should render', async () => {
    await render(ApplicationPageComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ApplicationListComponent],
      providers: [
        provideMockStore({ initialState }),
        { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: {} },
        provideHttpClient(),
        { provide: ENVIRONMENT_CONFIG, useValue: { viewerBaseUrl: '' } },
        { provide: APP_BASE_HREF, useValue: '' },
      ],
    });
    expect(await screen.findByText('Applications')).toBeInTheDocument();
  });
});
