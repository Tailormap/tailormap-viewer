import { render, screen } from '@testing-library/angular';
import { UserHomeComponent } from './user-home.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('UserHomeComponent', () => {

  test('should render', async () => {
    await render(UserHomeComponent, { imports: [ SharedImportsModule, MatIconTestingModule ] });
    expect(await screen.findByText('Add user')).toBeInTheDocument();
  });

});
