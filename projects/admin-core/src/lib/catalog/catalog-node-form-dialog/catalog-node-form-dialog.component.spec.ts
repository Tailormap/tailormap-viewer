import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { CatalogNodeFormDialogComponent } from './catalog-node-form-dialog.component';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CatalogService } from '../services/catalog.service';
import { getCatalogNode } from '@tailormap-admin/admin-api';
import userEvent from '@testing-library/user-event';
import { TestSaveHelper } from '../../test-helpers/test-save.helper.spec';

const setup = async (editMode = false) => {
  const dialogRefMock = { close: vi.fn() };
  const catalogServiceMock = {
    createCatalogNode$: vi.fn(() => of(true)),
    updateCatalogNode$: vi.fn(() => of(true)),
  };
  await render(CatalogNodeFormDialogComponent, {
    providers: [
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: CatalogService, useValue: catalogServiceMock },
      { provide: MAT_DIALOG_DATA, useValue: { node: editMode ? getCatalogNode({ id: '2', title: 'The editable folder', root: false }) : null, parentNode: '1' } },
    ],
  });
  return {
    catalogServiceMock,
    dialogRefMock,
  };
};

describe('CatalogNodeFormDialogComponent', () => {

  test('should render and handle cancel', async () => {
    const { dialogRefMock } = await setup();
    expect(screen.getByText('Create new folder')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Cancel'));
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  test('should save new node', async () => {
    vi.useFakeTimers();
    const ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });
    const { catalogServiceMock, dialogRefMock } = await setup();
    expect(screen.getByText('Create new folder')).toBeInTheDocument();
    await ue.type(screen.getByLabelText('Title'), 'The new folder');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save', undefined, ue);
    await ue.click(screen.getByText('Save'));
    expect(catalogServiceMock.createCatalogNode$).toHaveBeenCalledWith({
      title: 'The new folder',
      type: 'catalog-node',
      root: false,
      parentId: '1',
      children: null,
      items: null,
    });
    expect(dialogRefMock.close).toHaveBeenCalled();
    vi.useRealTimers();
  });

  test('should edit node', async () => {
    vi.useFakeTimers();
    const ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });
    const { catalogServiceMock, dialogRefMock } = await setup(true);
    expect(screen.getByText('Edit The editable folder')).toBeInTheDocument();
    await ue.type(screen.getByLabelText('Title'), '_edited');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save', undefined, ue);
    await ue.click(screen.getByText('Save'));
    expect(catalogServiceMock.updateCatalogNode$).toHaveBeenCalledWith({
      id: '2',
      title: 'The editable folder_edited',
      type: 'catalog-node',
      root: false,
      parentId: '1',
      children: null,
      items: [],
    });
    expect(dialogRefMock.close).toHaveBeenCalled();
    vi.useRealTimers();
  });

});
