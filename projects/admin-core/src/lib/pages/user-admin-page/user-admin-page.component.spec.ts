import { render, screen } from '@testing-library/angular';
import { UserAdminPageComponent } from './user-admin-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AdminTemplateComponent } from '../../templates/admin-template/admin-template.component';
import { NavigationComponent } from '../../templates/admin-template/navigation/navigation.component';
import { UserdetailsFormComponent } from '../../useradmin/userdetails-form/userdetails-form.component';
import { UserlistComponent } from '../../useradmin/userlist/userlist.component';
import { getUsers, TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';
import { of } from 'rxjs';
import { GrouplistComponent } from '../../useradmin/grouplist/grouplist.component';
import { MatListModule } from '@angular/material/list';


const setup = async () => {
  const mockApiService = {
    getUsers$: jest.fn(() => of(getUsers)),
    getGroups$: jest.fn(() => of(null)),
  };

  await render(UserAdminPageComponent, {
    imports: [ SharedModule, MatListModule, MatIconTestingModule ],
    declarations: [ AdminTemplateComponent, NavigationComponent, UserdetailsFormComponent, UserlistComponent, GrouplistComponent ],
    providers: [
      { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: mockApiService },
    ],
  });
  return { mockApiService };
};

describe('UserAdminPageComponent', () => {
  test('should render', async () => {
    await setup();
    // title
    expect(await screen.findAllByText('User Administration')).toHaveLength(1);
  });
});
