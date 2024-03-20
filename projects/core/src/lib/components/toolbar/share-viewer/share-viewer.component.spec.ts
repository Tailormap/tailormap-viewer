import { render, screen } from '@testing-library/angular';
import { ShareViewerComponent } from './share-viewer.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('ShareViewerComponent', () => {

  test('should render', async () => {
    await render(ShareViewerComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [],
    });
    expect(screen.getByLabelText('Share viewer'));
  });

});
