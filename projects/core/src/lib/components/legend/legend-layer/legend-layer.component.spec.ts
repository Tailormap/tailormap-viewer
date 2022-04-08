import { render, screen } from '@testing-library/angular';
import { LegendLayerComponent } from './legend-layer.component';

describe('LegendLayerComponent', () => {

  test('should render', async () => {
    await render(LegendLayerComponent);
    expect(screen.getByText('legend-layer works!'));
  });

});
