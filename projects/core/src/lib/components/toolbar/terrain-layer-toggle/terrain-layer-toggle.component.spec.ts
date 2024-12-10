import { render, screen } from '@testing-library/angular';
import { TerrainLayerToggleComponent } from './terrain-layer-toggle.component';

describe('TerrainLayerToggleComponent', () => {

  test('should render', async () => {
    await render(TerrainLayerToggleComponent);
    expect(screen.getByText('terrain-layer-toggle works!'));
  });

});
