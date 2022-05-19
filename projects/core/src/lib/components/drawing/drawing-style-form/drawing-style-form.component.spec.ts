import { render, screen } from '@testing-library/angular';
import { DrawingStyleFormComponent } from './drawing-style-form.component';

describe('DrawingStyleFormComponent', () => {

  test('should render', async () => {
    await render(DrawingStyleFormComponent);
    expect(screen.getByText('drawing-style-form works!'));
  });

});
