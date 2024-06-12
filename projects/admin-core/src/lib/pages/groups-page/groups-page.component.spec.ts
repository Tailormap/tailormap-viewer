import { render, screen } from '@testing-library/angular';
import { GroupsPageComponent } from './groups-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatListModule } from '@angular/material/list';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GroupListComponent } from '../../user/group-list/group-list.component';
import { provideMockStore } from '@ngrx/store/testing';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';


const setup = async () => {
  await render(GroupsPageComponent, {
    imports: [ SharedModule, MatListModule, MatIconTestingModule ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [GroupListComponent],
    providers: [ provideMockStore(), AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser() ],
  });
};

describe('GroupsPageComponent', () => {

  test('should render', async () => {
    await setup();
    expect(await screen.findAllByText('Groups')).toHaveLength(1);
  });

});
