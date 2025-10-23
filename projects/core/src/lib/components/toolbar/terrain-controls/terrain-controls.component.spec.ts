import { render, screen } from '@testing-library/angular';
import { TerrainControlsComponent } from './terrain-controls.component';

describe('TerrainControlsComponent', () => {

  test('should render', async () => {
    await render(TerrainControlsComponent);
    expect(screen.getByText('terrain-controls works!'));
  });

});
