import { render, screen } from '@testing-library/angular';
import { ShareViewerComponent } from './share-viewer.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { selectShowLoginButton, selectUserDetails, selectUserIsAdmin } from '../../../state/core.selectors';

describe('ShareViewerComponent', () => {

  test('should render', async () => {
    await render(ShareViewerComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectUserIsAdmin, value: true },
          ],
        }),
      ],
    });
    expect(screen.getByLabelText('Share viewer'));
  });

});
