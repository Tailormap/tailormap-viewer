import { render, screen } from '@testing-library/angular';
import { MobileMenubarHomeButtonComponent } from './mobile-menubar-home-button.component';

describe('MobileMenubarHomeButtonComponent', () => {

  test('should render', async () => {
    await render(MobileMenubarHomeButtonComponent);
    expect(screen.getByText('mobile-menubar-home-button works!'));
  });

});
