import { render, screen } from '@testing-library/angular';
import { MobileMenubarPanelComponent } from './mobile-menubar-panel.component';

describe('MobileMenubarPanelComponent', () => {

  test('should render', async () => {
    await render(MobileMenubarPanelComponent);
    expect(screen.getByText('mobile-menubar-panel works!'));
  });

});
