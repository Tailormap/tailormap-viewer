import { render, screen } from '@testing-library/angular';
import { ScaleBarComponent } from './scale-bar.component';

describe('ScaleBarComponent', () => {

  test('should render', async () => {
    await render(ScaleBarComponent);
    expect(screen.getByText('scale-bar works!'));
  });

});
