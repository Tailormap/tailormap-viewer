import { render, screen } from '@testing-library/angular';
import { AdminHomePageComponent } from './admin-home-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('AdminHomePageComponent', () => {

  test('should render', async () => {
    await render(AdminHomePageComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
    });
    expect(screen.getByText('Welcome to Tailormap Admin'));
  });

});
