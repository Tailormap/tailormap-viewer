import { render, screen } from '@testing-library/angular';
import { AdminHomePageComponent } from './admin-home-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AdminTemplateComponent } from '../../templates/admin-template/admin-template.component';
import { NavigationComponent } from '../../templates/admin-template/navigation/navigation.component';
import { provideMockStore } from '@ngrx/store/testing';
import { adminCoreStateKey, initialAdminCoreState } from '../../state/admin-core.state';
import { TAILORMAP_SECURITY_API_V1_SERVICE } from '@tailormap-viewer/api';
import { of } from 'rxjs';

describe('AdminHomePageComponent', () => {

  test('should render', async () => {
    await render(AdminHomePageComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ AdminTemplateComponent, NavigationComponent ],
      providers: [
        { provide: TAILORMAP_SECURITY_API_V1_SERVICE, useValue: { getUser$: jest.fn(() => of({})) } },
        provideMockStore({
          initialState: {
            [adminCoreStateKey]: { ...initialAdminCoreState, security: { isAuthenticated: true, roles: ['admin'] } },
          },
        }),
      ],
    });
    expect(screen.getByText('Tailormap Admin'));
  });

});
