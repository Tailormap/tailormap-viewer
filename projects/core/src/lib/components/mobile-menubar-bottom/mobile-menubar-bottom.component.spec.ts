import { render, screen } from '@testing-library/angular';
import { MobileMenubarBottomComponent } from './mobile-menubar-bottom.component';

describe('MobileMenubarBottomComponent', () => {

  test('should render', async () => {
    await render(MobileMenubarBottomComponent);
    expect(screen.getByText('mobile-menubar-bottom works!'));
  });

});
