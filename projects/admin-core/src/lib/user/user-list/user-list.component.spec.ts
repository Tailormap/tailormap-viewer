import { render, screen } from '@testing-library/angular';
import { UserListComponent } from './user-list.component';
import { getUsers, TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';
import { of } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { SharedModule } from '@tailormap-viewer/shared';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../state/user.state';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';
import { SharedAdminComponentsModule } from '../../shared/components/shared-admin-components.module';

const setup = async () => {
  const mockApiService = {
    getUsers$: jest.fn(() => of(getUsers)),
  };

  await render(UserListComponent, {
    imports: [ SharedModule, MatListModule, SharedAdminComponentsModule ],
    providers: [
      { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: mockApiService },
      provideMockStore({ initialState: { [userStateKey]: initialUserState } }),
      AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
    ],
  });

  return { mockApiService };
};

describe('UserListComponent', () => {
  test('should render', async () => {
    const { mockApiService } = await setup();
    expect(screen.getByText('Users'));
  });
});
