import { render, screen } from '@testing-library/angular';
import { GroupsPageComponent } from './groups-page.component';
import { of } from 'rxjs';
import { getUsers, TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatListModule } from '@angular/material/list';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AdminTemplateComponent } from '../../templates/admin-template/admin-template.component';
import { NavigationComponent } from '../../templates/admin-template/navigation/navigation.component';
import { GrouplistComponent } from '../../useradmin/grouplist/grouplist.component';
import { GroupdetailsFormComponent } from '../../useradmin/groupdetails-form/groupdetails-form.component';


const setup = async () => {
  const mockApiService = {
    getUsers$: jest.fn(() => of(getUsers)),
    getGroups$: jest.fn(() => of(null)),
  };

  await render(GroupsPageComponent, {
    imports: [ SharedModule, MatListModule, MatIconTestingModule ],
    declarations: [ AdminTemplateComponent, NavigationComponent, GroupdetailsFormComponent, GrouplistComponent ],
    providers: [
      { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: mockApiService },
    ],
  });
  return { mockApiService };
};

describe('GroupsPageComponent', () => {

  test('should render', async () => {
    await setup();
    expect(await screen.findAllByText('Group Administration')).toHaveLength(1);
  });

});
