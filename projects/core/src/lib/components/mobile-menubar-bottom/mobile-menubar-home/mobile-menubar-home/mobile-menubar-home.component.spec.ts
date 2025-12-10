import { render, screen } from '@testing-library/angular';
import { MobileMenubarHomeComponent } from './mobile-menubar-home.component';

describe('MobileMenubarHomeComponent', () => {

  test('should render', async () => {
    await render(MobileMenubarHomeComponent);
    expect(screen.getByText('mobile-menubar-home works!'));
  });

});
