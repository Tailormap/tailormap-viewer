import { render, screen } from '@testing-library/angular';
import { UserListComponent } from './user-list.component';
import { getUsers, TailormapAdminApiV1Service, } from '@tailormap-admin/admin-api';
import { of } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { SharedModule } from '@tailormap-viewer/shared';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../state/user.state';
import { adminCoreStateKey, initialAdminCoreState } from '../../state/admin-core.state';

const setup = async () => {
  const mockApiService = {
    getUsers$: jest.fn(() => of(getUsers)),
  };

  await render(UserListComponent, {
    imports: [ SharedModule, MatListModule ],
    providers: [
      { provide: TailormapAdminApiV1Service, useValue: mockApiService },
      provideMockStore({ initialState: { [userStateKey]: initialUserState, [adminCoreStateKey]: initialAdminCoreState } }),
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
