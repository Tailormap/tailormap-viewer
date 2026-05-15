import { render, screen } from '@testing-library/angular';
import { UserAdminPageComponent } from './user-admin-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatListModule } from '@angular/material/list';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UserListComponent } from '../../user/user-list/user-list.component';
import { provideMockStore } from '@ngrx/store/testing';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';
import { provideHttpClient } from '@angular/common/http';
import { SharedAdminComponentsModule } from '../../shared/components/shared-admin-components.module';
import { initialUserState, userStateKey } from '../../user/state/user.state';

const setup = async () => {
  await render(UserAdminPageComponent, {
    imports: [ SharedModule, MatListModule, MatIconTestingModule, SharedAdminComponentsModule ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [UserListComponent],
    providers: [
      provideMockStore({ initialState: { [userStateKey]: initialUserState } }),
      provideHttpClient(),
      AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
    ],
  });
};

describe('UserAdminPageComponent', () => {
  test('should render', async () => {
    await setup();
    expect(await screen.findAllByText('Users')).toHaveLength(1);
  });
});
