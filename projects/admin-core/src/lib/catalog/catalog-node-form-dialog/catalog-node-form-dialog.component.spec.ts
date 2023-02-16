import { render, screen } from '@testing-library/angular';
import { CatalogNodeFormDialogComponent } from './catalog-node-form-dialog.component';

describe('CatalogNodeFormDialogComponent', () => {

  test('should render', async () => {
    await render(CatalogNodeFormDialogComponent);
    expect(screen.getByText('catalog-node-form-dialog works!'));
  });

});
