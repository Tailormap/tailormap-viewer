import { render, screen } from '@testing-library/angular';
import { TerrainOpacityComponent } from './terrain-opacity.component';

describe('TerrainTranslucencyComponent', () => {

  test('should render', async () => {
    await render(TerrainOpacityComponent);
    expect(screen.getByText('terrain-translucency works!'));
  });

});
