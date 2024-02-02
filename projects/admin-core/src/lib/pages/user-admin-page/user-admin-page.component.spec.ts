import { render, screen } from '@testing-library/angular';
import { UserAdminPageComponent } from './user-admin-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatListModule } from '@angular/material/list';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UserListComponent } from '../../user/user-list/user-list.component';
import { provideMockStore } from '@ngrx/store/testing';


const setup = async () => {
  await render(UserAdminPageComponent, {
    imports: [ SharedModule, MatListModule, MatIconTestingModule ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [UserListComponent],
    providers: [provideMockStore()],
  });
};

describe('UserAdminPageComponent', () => {
  test('should render', async () => {
    await setup();
    // title
    expect(await screen.findAllByText('Users')).toHaveLength(1);
  });
});
