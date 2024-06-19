import { render, screen } from '@testing-library/angular';
import { ShareViewerComponent } from './share-viewer.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AuthenticatedUserTestHelper } from '../../../test-helpers/authenticated-user-test.helper';

describe('ShareViewerComponent', () => {

  test('should render', async () => {
    await render(ShareViewerComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
      ],
    });
    expect(screen.getByLabelText('Share viewer'));
  });

});
