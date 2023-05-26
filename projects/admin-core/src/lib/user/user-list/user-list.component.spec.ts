import { render, screen } from '@testing-library/angular';
import { UserListComponent } from './user-list.component';
import { getUsers, TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';
import { of } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { SharedModule } from '@tailormap-viewer/shared';

const setup = async () => {
  const mockApiService = {
    getUsers$: jest.fn(() => of(getUsers)),
  };

  await render(UserListComponent, {
    imports: [ SharedModule, MatListModule ],
    providers: [
      { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: mockApiService },
    ],
  });

  return { mockApiService };
};

describe('UserListComponent', () => {
  test('should render', async () => {
    const { mockApiService } = await setup();
    expect(screen.getByText('Users'));
  });
});