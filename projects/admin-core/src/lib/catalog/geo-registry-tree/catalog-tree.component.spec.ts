import { render, screen } from '@testing-library/angular';
import { CatalogTreeComponent } from './catalog-tree.component';

describe('GeoRegistryTreeComponent', () => {

  test('should render', async () => {
    await render(CatalogTreeComponent);
    expect(screen.getByText('geo-registry-tree works!'));
  });

});
