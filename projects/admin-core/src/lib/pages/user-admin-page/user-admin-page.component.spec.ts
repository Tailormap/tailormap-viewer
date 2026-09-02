import { render, screen } from '@testing-library/angular';
import { UserAdminPageComponent } from './user-admin-page.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatListModule } from '@angular/material/list';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';
import { provideHttpClient } from '@angular/common/http';
import { initialUserState, userStateKey } from '../../user/state/user.state';

const setup = async () => {
  await render(UserAdminPageComponent, {
    imports: [ MatListModule, MatIconTestingModule ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
