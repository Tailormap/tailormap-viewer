import { render, screen } from '@testing-library/angular';
import { CatalogNodeFormComponent } from './catalog-node-form.component';

describe('CatalogNodeFormComponent', () => {

  test('should render', async () => {
    await render(CatalogNodeFormComponent);
    expect(screen.getByText('catalog-node-form works!'));
  });

});
