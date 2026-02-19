import { render, screen } from '@testing-library/angular';
import { ProfileMenuButtonComponent } from './profile-menu-button.component';

describe('ProfileMenuButtonComponent', () => {

  test('should render', async () => {
    await render(ProfileMenuButtonComponent);
    expect(screen.getByText('profile-menu-button works!'));
  });

});
