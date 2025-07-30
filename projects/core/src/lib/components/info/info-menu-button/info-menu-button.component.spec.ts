import { render, screen } from '@testing-library/angular';
import { InfoMenuButtonComponent } from './info-menu-button.component';

describe('InfoMenuButtonComponent', () => {

  test('should render', async () => {
    await render(InfoMenuButtonComponent);
    expect(screen.getByText('info-menu-button works!'));
  });

});
