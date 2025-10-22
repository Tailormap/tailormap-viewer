import { render, screen } from '@testing-library/angular';
import { TerrainTranslucencyComponent } from './terrain-translucency.component';

describe('TerrainTranslucencyComponent', () => {

  test('should render', async () => {
    await render(TerrainTranslucencyComponent);
    expect(screen.getByText('terrain-translucency works!'));
  });

});
