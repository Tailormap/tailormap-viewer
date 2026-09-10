import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { UserListComponent } from './user-list.component';
import { getUsers, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { of } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../state/user.state';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';
import { TailormapSecurityApiV1Service } from '@tailormap-viewer/api';

const setup = async () => {
  const mockAdminApiService = {
    getUsers$: vi.fn(() => of(getUsers)),
  };
  const mockApiService = {};

  await render(UserListComponent, {
    imports: [MatListModule],
    providers: [
      { provide: TailormapAdminApiV1Service, useValue: mockAdminApiService },
      { provide: TailormapSecurityApiV1Service, useValue: mockApiService },
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
