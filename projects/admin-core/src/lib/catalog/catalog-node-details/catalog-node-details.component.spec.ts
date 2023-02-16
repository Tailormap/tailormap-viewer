import { render, screen } from '@testing-library/angular';
import { CatalogNodeDetailsComponent } from './catalog-node-details.component';

describe('CatalogNodeDetailsComponent', () => {

  test('should render', async () => {
    await render(CatalogNodeDetailsComponent);
    expect(screen.getByText('catalog-node-details works!'));
  });

});
