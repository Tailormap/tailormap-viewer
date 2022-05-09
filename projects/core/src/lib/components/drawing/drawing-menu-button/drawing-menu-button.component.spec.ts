import { render, screen } from '@testing-library/angular';
import { DrawingMenuButtonComponent } from './drawing-menu-button.component';

describe('DrawingMenuButtonComponent', () => {

  test('should render', async () => {
    await render(DrawingMenuButtonComponent);
    expect(screen.getByText('drawing-menu-button works!'));
  });

});
