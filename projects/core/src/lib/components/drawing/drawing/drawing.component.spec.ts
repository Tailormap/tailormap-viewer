import { render, screen } from '@testing-library/angular';
import { DrawingComponent } from './drawing.component';

describe('DrawingComponent', () => {

  test('should render', async () => {
    await render(DrawingComponent);
    expect(screen.getByText('drawing works!'));
  });

});
