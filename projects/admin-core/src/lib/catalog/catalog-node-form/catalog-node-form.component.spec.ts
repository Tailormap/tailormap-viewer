import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { CatalogNodeFormComponent } from './catalog-node-form.component';
import userEvent from '@testing-library/user-event';

describe('CatalogNodeFormComponent', () => {

  test('should render', async () => {
    const changedFn = vi.fn();
    await render(CatalogNodeFormComponent, {
      inputs: { parentNode: '1' },
      on: { changed: changedFn },
    });
    await userEvent.type(await screen.findByPlaceholderText('Title'), 'Some title');
    await vi.waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(1);
      expect(changedFn).toHaveBeenCalledWith({ title: 'Some title', parentId: '1', root: false, children: null, items: null, type: 'catalog-node' });
    });
    await userEvent.type(await screen.findByPlaceholderText('Title'), ' for a folder');
    await vi.waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(2);
      expect(changedFn).toHaveBeenCalledWith({ title: 'Some title for a folder', parentId: '1', root: false, children: null, items: null, type: 'catalog-node' });
    });
  });

});
