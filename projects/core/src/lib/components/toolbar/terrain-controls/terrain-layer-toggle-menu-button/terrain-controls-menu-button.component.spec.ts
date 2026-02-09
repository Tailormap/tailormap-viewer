import { render, screen } from '@testing-library/angular';
import { TerrainControlsMenuButtonComponent } from './terrain-controls-menu-button.component';

describe('TerrainLayerToggleMenuButtonComponent', () => {

  test('should render', async () => {
    await render(TerrainControlsMenuButtonComponent);
    expect(screen.getByText('terrain-layer-toggle-menu-button works!'));
  });

});
