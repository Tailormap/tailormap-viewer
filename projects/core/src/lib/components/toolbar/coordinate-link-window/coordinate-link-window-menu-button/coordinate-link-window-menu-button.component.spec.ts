import { render, screen } from '@testing-library/angular';
import { CoordinateLinkWindowMenuButtonComponent } from './coordinate-link-window-menu-button.component';

describe('CoordinateLinkWindowMenuButtonComponent', () => {

  test('should render', async () => {
    await render(CoordinateLinkWindowMenuButtonComponent);
    expect(screen.getByText('coordinate-link-window-menu-button works!'));
  });

});
