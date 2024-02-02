import { render, screen } from '@testing-library/angular';
import { AdminTemplateComponent } from './admin-template.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { NavigationComponent } from './navigation/navigation.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { provideMockStore } from '@ngrx/store/testing';
import { adminCoreStateKey, initialAdminCoreState } from '../../state/admin-core.state';
import { TAILORMAP_SECURITY_API_V1_SERVICE } from '@tailormap-viewer/api';
import { of } from 'rxjs';
import { APP_BASE_HREF } from '@angular/common';

describe('AdminTemplateComponent', () => {

  test('should AdminTemplateComponent', async () => {
    await render(AdminTemplateComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [NavigationComponent],
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
    expect(await screen.findByText('Home')).toBeInTheDocument();
    expect(await screen.findByText('Catalog')).toBeInTheDocument();
  });

});
