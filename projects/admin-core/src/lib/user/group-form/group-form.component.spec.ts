import { render, screen } from '@testing-library/angular';
import { GroupFormComponent } from './group-form.component';
import { of } from 'rxjs';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatListModule } from '@angular/material/list';
import { TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';


const setup = async () => {
  const mockApiService = {
    getGroups$: jest.fn(() => of(null)),
  };

  await render(GroupFormComponent, {
    imports: [ SharedModule, MatListModule ],
    providers: [
      { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: mockApiService },
    ],
  });
  return { mockApiService };
};
describe('GroupdetailsFormComponent', () => {

  test('should render with Add/Delete button disabled', async () => {
    await setup();
    expect(screen.getByText('Group Details'));
    expect(screen.getByText('Add'));
    expect(screen.getByText('Add').parentNode).toHaveProperty('disabled', true);
    expect(screen.getByText('Delete'));
    expect(screen.getByText('Delete').parentNode).toHaveProperty('disabled', true);
  });

});
