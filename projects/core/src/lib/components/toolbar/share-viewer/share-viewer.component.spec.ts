import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { ShareViewerComponent } from './share-viewer.component';
import { AuthenticatedUserTestHelper } from '../../../test-helpers/authenticated-user-test.helper';

describe('ShareViewerComponent', () => {

  test('should render', async () => {
    await render(ShareViewerComponent, {
      imports: [],
      providers: [
        AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
      ],
    });
    expect(screen.getByLabelText('Share viewer'));
  });

});
