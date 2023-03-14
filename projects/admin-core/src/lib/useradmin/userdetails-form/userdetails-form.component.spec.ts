import { render, screen } from '@testing-library/angular';
import { UserdetailsFormComponent } from './userdetails-form.component';
import { of } from 'rxjs';
import { TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatListModule } from '@angular/material/list';


const setup = async () => {
  const mockApiService = {
    getGroups$: jest.fn(() => of(null)),
    getUsers$: jest.fn(() => of(null)),
  };

  await render(UserdetailsFormComponent, {
    imports: [ SharedModule, MatListModule ],
    providers: [
      { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: mockApiService },
    ],
  });
  return { mockApiService };
};

describe('UserdetailsFormComponent', () => {
  test('should render', async () => {
    await setup();
    expect(screen.getByText('Delete'));
  });

});
