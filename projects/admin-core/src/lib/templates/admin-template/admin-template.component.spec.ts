import { render, screen } from '@testing-library/angular';
import { AdminTemplateComponent } from './admin-template.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { NavigationComponent } from './navigation/navigation.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { TAILORMAP_SECURITY_API_V1_SERVICE } from '@tailormap-viewer/api';
import { of } from 'rxjs';
import { APP_BASE_HREF } from '@angular/common';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';

describe('AdminTemplateComponent', () => {

  test('should AdminTemplateComponent', async () => {
    await render(AdminTemplateComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [NavigationComponent],
      providers: [
        { provide: APP_BASE_HREF, useValue: '' },
        { provide: TAILORMAP_SECURITY_API_V1_SERVICE, useValue: { getUser$: jest.fn(() => of({})) } },
        AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
      ],
    });
    expect(await screen.findByText('Home')).toBeInTheDocument();
    expect(await screen.findByText('Catalog')).toBeInTheDocument();
  });

});
