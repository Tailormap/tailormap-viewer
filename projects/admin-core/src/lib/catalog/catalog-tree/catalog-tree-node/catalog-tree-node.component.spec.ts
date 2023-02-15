import { render, screen } from '@testing-library/angular';
import { CatalogTreeNodeComponent } from './catalog-tree-node.component';

describe('CatalogTreeNodeComponent', () => {

  test('should render', async () => {
    await render(CatalogTreeNodeComponent);
    expect(screen.getByText('catalog-tree-node works!'));
  });

});
