import { render, screen } from '@testing-library/angular';
import { PrintMenuButtonComponent } from './print-menu-button.component';

describe('PrintMenuButtonComponent', () => {

  test('should render', async () => {
    await render(PrintMenuButtonComponent);
    expect(screen.getByText('print-menu-button works!'));
  });

});
