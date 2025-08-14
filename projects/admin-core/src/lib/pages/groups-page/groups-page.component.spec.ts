import { render, screen } from '@testing-library/angular';
import { GroupsPageComponent } from './groups-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatListModule } from '@angular/material/list';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GroupListComponent } from '../../user/group-list/group-list.component';
import { provideMockStore } from '@ngrx/store/testing';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';
import { provideHttpClient } from '@angular/common/http';
import { SharedAdminComponentsModule } from '../../shared/components/shared-admin-components.module';
import { initialUserState, userStateKey } from '../../user/state/user.state';
import { TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';

const setup = async () => {
  await render(GroupsPageComponent, {
    imports: [ SharedModule, MatListModule, MatIconTestingModule, SharedAdminComponentsModule ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [GroupListComponent],
    providers: [
      provideMockStore({ initialState: { [userStateKey]: initialUserState } }),
      provideHttpClient(),
      AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
      { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: {} },
    ],
  });
};

describe('GroupsPageComponent', () => {
  it('should render', async () => {
    await setup();
    expect(await screen.findByText('Groups')).toBeInTheDocument();
  });
});
