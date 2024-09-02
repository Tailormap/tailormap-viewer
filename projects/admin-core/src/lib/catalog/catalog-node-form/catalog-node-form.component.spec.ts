import { render, screen, waitFor } from '@testing-library/angular';
import { CatalogNodeFormComponent } from './catalog-node-form.component';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';

describe('CatalogNodeFormComponent', () => {

  test('should render', async () => {
    const changedFn = jest.fn();
    await render(CatalogNodeFormComponent, {
      imports: [SharedModule],
      inputs: { parentNode: '1' },
      on: { changed: changedFn },
    });
    await userEvent.type(await screen.findByPlaceholderText('Title'), 'Some title');
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(1);
      expect(changedFn).toHaveBeenCalledWith({ title: 'Some title', parentId: '1', root: false, children: null, items: null, type: 'catalog-node' });
    });
    await userEvent.type(await screen.findByPlaceholderText('Title'), ' for a folder');
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(2);
      expect(changedFn).toHaveBeenCalledWith({ title: 'Some title for a folder', parentId: '1', root: false, children: null, items: null, type: 'catalog-node' });
    });
  });

});
