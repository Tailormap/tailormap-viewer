import { render, screen } from '@testing-library/angular';
import { NavigationComponent } from './navigation.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { adminCoreStateKey, initialAdminCoreState } from '../../../state/admin-core.state';
import { TAILORMAP_SECURITY_API_V1_SERVICE } from '@tailormap-viewer/api';
import { of } from 'rxjs';
import { APP_BASE_HREF } from '@angular/common';

const setup = async (isAuthenticated: boolean, nonAdminUser?: boolean) => {
  const api = { getUser$: jest.fn(() => of({})) };
  const store = provideMockStore({
    initialState: {
      [adminCoreStateKey]: {
        ...initialAdminCoreState,
        security: {
          isAuthenticated,
          username: isAuthenticated ? (nonAdminUser ? 'regular-user' : 'admin-user') : undefined,
          roles: isAuthenticated ? (nonAdminUser ? ['user'] : ['admin']) : undefined,
        },
      },
    },
  });
  await render(NavigationComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      store,
      { provide: TAILORMAP_SECURITY_API_V1_SERVICE, useValue: api },
      { provide: APP_BASE_HREF, useValue: '' },
    ],
  });
  return { api };
};

describe('NavigationComponent', () => {

  test('should render', async () => {
    const { api } = await setup(false);
    expect(await screen.findByText('Home')).toBeInTheDocument();
    expect(await screen.queryByText('Catalog')).not.toBeInTheDocument();
    expect(api.getUser$).toHaveBeenCalled();
  });

  test('should render with logged in user', async () => {
    await setup(true);
    expect(await screen.findByText('Home')).toBeInTheDocument();
    expect(await screen.queryByText('Catalog')).toBeInTheDocument();
    expect(await screen.queryByText('admin-user')).toBeInTheDocument();
  });

  test('should render with logged in non-admin user', async () => {
    await setup(true, true);
    expect(await screen.findByText('Home')).toBeInTheDocument();
    expect(await screen.queryByText('Catalog')).not.toBeInTheDocument();
    expect(await screen.queryByText('regular-user')).toBeInTheDocument();
  });

});
