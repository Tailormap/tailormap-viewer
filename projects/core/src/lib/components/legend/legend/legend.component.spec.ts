import { render, screen } from '@testing-library/angular';
import { LegendComponent } from './legend.component';

describe('LegendComponent', () => {

  test('should render', async () => {
    await render(LegendComponent);
    expect(screen.getByText('legend works!'));
  });

});
