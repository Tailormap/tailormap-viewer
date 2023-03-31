import { render, screen } from '@testing-library/angular';
import { ApplicationHomeComponent } from './application-home.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('ApplicationHomeComponent', () => {

  test('should render', async () => {
    await render(ApplicationHomeComponent, {
      imports: [ SharedImportsModule, MatIconTestingModule ],
    });
    expect(screen.getByText('Add application'));
  });

});
