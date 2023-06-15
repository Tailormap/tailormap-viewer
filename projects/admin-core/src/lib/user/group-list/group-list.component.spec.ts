import { render, screen } from '@testing-library/angular';
import { GroupListComponent } from './group-list.component';
import { of } from 'rxjs';
import { TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatListModule } from '@angular/material/list';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../state/user.state';
import { adminCoreStateKey, initialAdminCoreState } from '../../state/admin-core.state';

const setup = async () => {
  const mockApiService = {
    getGroups$: jest.fn(() => of(null)),
  };

  await render(GroupListComponent, {
    imports: [ SharedModule, MatListModule ],
    providers: [
      { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: mockApiService },
      provideMockStore({ initialState: { [userStateKey]: initialUserState, [adminCoreStateKey]: initialAdminCoreState } }),
    ],
  });
  return { mockApiService };
};

describe('GroupListComponent', () => {

  test('should render', async () => {
    const { mockApiService } = await setup();
    expect(screen.getByText('Groups'));
  });

});
