import { render, screen } from '@testing-library/angular';
import { GroupListComponent } from './group-list.component';
import { of } from 'rxjs';
import { TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatListModule } from '@angular/material/list';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../state/user.state';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';
import { SharedAdminComponentsModule } from '../../shared/components/shared-admin-components.module';

const setup = async () => {
  const mockApiService = {
    getGroups$: jest.fn(() => of(null)),
  };

  await render(GroupListComponent, {
    imports: [ SharedModule, MatListModule, SharedAdminComponentsModule ],
    providers: [
      { provide: TailormapAdminApiV1Service, useValue: mockApiService },
      provideMockStore({ initialState: { [userStateKey]: initialUserState } }),
      AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
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
