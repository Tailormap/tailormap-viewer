import { render, screen } from '@testing-library/angular';
import { ApplicationPageComponent } from './application-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AdminTemplateComponent } from '../../templates/admin-template/admin-template.component';
import { NavigationComponent } from '../../templates/admin-template/navigation/navigation.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { adminCoreStateKey, initialAdminCoreState } from '../../state/admin-core.state';
import { TAILORMAP_SECURITY_API_V1_SERVICE } from '@tailormap-viewer/api';
import { of } from 'rxjs';
import { APP_BASE_HREF } from '@angular/common';

describe('ApplicationPageComponent', () => {

  test('should render', async () => {
    await render(ApplicationPageComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ AdminTemplateComponent, NavigationComponent ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '' },
        { provide: TAILORMAP_SECURITY_API_V1_SERVICE, useValue: { getUser$: jest.fn(() => of({})) } },
        provideMockStore({
          initialState: {
            [adminCoreStateKey]: { ...initialAdminCoreState, security: { isAuthenticated: true, roles: ['admin'] } },
          },
        }),
      ],
    });
    // Menu item and title
    expect(await screen.findAllByText('Applications')).toHaveLength(2);
  });

});
